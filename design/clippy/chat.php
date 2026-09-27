<?php
/*
 * Clippy backend for the portfolio.
 * Holds the Claude API key server-side and answers questions about Roie using
 * the system prompt in system-prompt.md.
 *
 * The API key is read from, in order:
 *   1. the ANTHROPIC_API_KEY environment variable
 *   2. a git-ignored file at design/clippy/.anthropic-key (raw key, single line)
 * The key is never sent to the browser.
 */

header('Content-Type: application/json; charset=utf-8');

// --- config ---
$MODEL       = getenv('AIH_MODEL') ?: 'claude-haiku-4-5-20251001'; // cheap + plenty for short Q&A
$MAX_TOKENS  = 400;
$MAX_MSG_LEN = 800;   // per user message
$MAX_HISTORY = 12;    // messages accepted from the client

// Abuse / cost guards
$DAILY_CAP_USD = getenv('AIH_DAILY_CAP') ? (float)getenv('AIH_DAILY_CAP') : 0.55; // ~ €0.50/day
$RATE_MAX      = 4;   // max requests per IP...
$RATE_WINDOW   = 60;  // ...per this many seconds
$USAGE_FILE    = __DIR__ . '/.usage.json'; // git-ignored, blocked from the web

// Approx model pricing, USD per 1M tokens (safety estimate; real billing is in the console)
$PRICING = [
  'claude-haiku-4-5-20251001' => ['in' => 1.00, 'out' => 5.00],
  'claude-sonnet-5'           => ['in' => 3.00, 'out' => 15.00],
];
$P = $PRICING[$MODEL] ?? ['in' => 3.00, 'out' => 15.00];

function fail($status, $message) {
  http_response_code($status);
  echo json_encode(['error' => $message]);
  exit;
}

function reply($answer) { // a normal Clippy message (HTTP 200), used for nap / slow-down too
  echo json_encode(['answer' => $answer]);
  exit;
}

// Read-modify-write the usage file under an exclusive lock. Best-effort: if the
// file can't be opened (non-writable dir), guards are skipped rather than failing.
function withUsage($path, $fn) {
  $fp = @fopen($path, 'c+');
  if (!$fp) { $d = []; return $fn($d); }
  @flock($fp, LOCK_EX);
  $data = json_decode(stream_get_contents($fp), true);
  if (!is_array($data)) $data = [];
  $res = $fn($data);
  @ftruncate($fp, 0); @rewind($fp); @fwrite($fp, json_encode($data)); @fflush($fp);
  @flock($fp, LOCK_UN); @fclose($fp);
  return $res;
}

function client_ip() {
  if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) return $_SERVER['HTTP_CF_CONNECTING_IP'];
  if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
    $p = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']); return trim($p[0]);
  }
  return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  fail(405, 'Method not allowed');
}

// --- resolve API key ---
// Order: env var, then a hidden key file, then a plain visible file (easiest to
// create in hosts like Hostinger). All are git-ignored and blocked from the web.
$apiKey = getenv('ANTHROPIC_API_KEY');
if (!$apiKey) {
  foreach (['/.anthropic-key', '/apikey.txt'] as $f) {
    $keyFile = __DIR__ . $f;
    if (is_readable($keyFile)) { $apiKey = trim(file_get_contents($keyFile)); }
    if ($apiKey) break;
  }
}
if (!$apiKey) {
  fail(500, 'Server is missing its API key. Set ANTHROPIC_API_KEY or create design/clippy/apikey.txt.');
}

// --- parse request ---
$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!is_array($body) || empty($body['messages']) || !is_array($body['messages'])) {
  fail(400, 'Expected a JSON body with a "messages" array.');
}

$incoming = array_slice($body['messages'], -$MAX_HISTORY);
$messages = [];
foreach ($incoming as $m) {
  if (!isset($m['role'], $m['content'])) continue;
  $role = $m['role'] === 'assistant' ? 'assistant' : 'user';
  $content = mb_substr(trim((string)$m['content']), 0, $MAX_MSG_LEN);
  if ($content === '') continue;
  $messages[] = ['role' => $role, 'content' => $content];
}
if (empty($messages)) {
  fail(400, 'No usable message content.');
}

// --- abuse / cost guards: per-IP rate limit + daily spend cap ---
$today = gmdate('Y-m-d');
$ip = client_ip();
$gate = withUsage($USAGE_FILE, function (&$d) use ($today, $ip, $RATE_MAX, $RATE_WINDOW, $DAILY_CAP_USD) {
  if (($d['day'] ?? '') !== $today) { $d = ['day' => $today, 'costUsd' => 0, 'ip' => []]; }
  if (($d['costUsd'] ?? 0) >= $DAILY_CAP_USD) return 'nap';
  $now = time();
  $hits = array_values(array_filter($d['ip'][$ip] ?? [], function ($t) use ($now, $RATE_WINDOW) {
    return $t > $now - $RATE_WINDOW;
  }));
  if (count($hits) >= $RATE_MAX) { $d['ip'][$ip] = $hits; return 'slow'; }
  $hits[] = $now; $d['ip'][$ip] = $hits;
  return 'ok';
});
if ($gate === 'nap') {
  $naps = [
    "That is me done for today. Even a paperclip needs his rest. Come back tomorrow.",
    "Clocking out for a nap. Ask me again tomorrow.",
    "I am spent for the day, off for a nap. Try me again tomorrow.",
  ];
  reply($naps[array_rand($naps)]);
}
if ($gate === 'slow') {
  reply("One at a time. Give me a breath and ask again.");
}

// --- load the system prompt (persona + all of Roie's material) ---
// Primary source is system-prompt.md; if it is missing, fall back to a minimal
// wrapper around knowledge.json so the endpoint still works.
$promptPath = __DIR__ . '/system-prompt.md';
if (is_readable($promptPath)) {
  $system = file_get_contents($promptPath);
} else {
  $kbPath = __DIR__ . '/knowledge.json';
  $kbText = is_readable($kbPath) ? file_get_contents($kbPath) : '{}';
  $system = "You answer questions about Roie Shalom from the knowledge base below. "
    . "Third person, short, no em-dashes, do not invent facts.\n\n" . $kbText;
}

// --- call the Claude API ---
// The system prompt is long and identical on every request, so mark it for
// prompt caching (cache_control) to cut cost and latency.
$payload = json_encode([
  'model'      => $MODEL,
  'max_tokens' => $MAX_TOKENS,
  'system'     => [
    ['type' => 'text', 'text' => $system, 'cache_control' => ['type' => 'ephemeral']],
  ],
  'messages'   => $messages,
]);

$ch = curl_init('https://api.anthropic.com/v1/messages');
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST           => true,
  CURLOPT_POSTFIELDS     => $payload,
  CURLOPT_TIMEOUT        => 30,
  CURLOPT_HTTPHEADER     => [
    'Content-Type: application/json',
    'x-api-key: ' . $apiKey,
    'anthropic-version: 2023-06-01',
  ],
]);

$response = curl_exec($ch);
if ($response === false) {
  $err = curl_error($ch);
  curl_close($ch);
  fail(502, 'Could not reach the model: ' . $err);
}
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = json_decode($response, true);
if ($httpCode !== 200) {
  $msg = $data['error']['message'] ?? 'Upstream error';
  fail(502, 'Model error: ' . $msg);
}

// --- add this call's estimated cost to today's tally ---
$u = $data['usage'] ?? [];
$cost = (
    ($u['input_tokens'] ?? 0) * $P['in']
  + ($u['cache_creation_input_tokens'] ?? 0) * $P['in'] * 1.25
  + ($u['cache_read_input_tokens'] ?? 0) * $P['in'] * 0.10
  + ($u['output_tokens'] ?? 0) * $P['out']
) / 1000000.0;
withUsage($USAGE_FILE, function (&$d) use ($today, $cost) {
  if (($d['day'] ?? '') !== $today) { $d = ['day' => $today, 'costUsd' => 0, 'ip' => []]; }
  $d['costUsd'] = ($d['costUsd'] ?? 0) + $cost;
});

// --- extract text ---
$answer = '';
if (!empty($data['content']) && is_array($data['content'])) {
  foreach ($data['content'] as $block) {
    if (($block['type'] ?? '') === 'text') {
      $answer .= $block['text'];
    }
  }
}
$answer = trim($answer);
if ($answer === '') {
  fail(502, 'The model returned an empty answer.');
}

// Hard rule: no em/en dashes, ever. Enforce it here so it holds no matter what
// the model does. Ranges between digits keep a hyphen; other dashes become commas.
$answer = preg_replace('/(\d)\s*[\x{2013}\x{2014}]\s*(\d)/u', '$1-$2', $answer); // 2019–2021 -> 2019-2021
$answer = preg_replace('/\s*[\x{2013}\x{2014}]\s*/u', ', ', $answer);            // — / – -> ", "
$answer = preg_replace('/\s+,/u', ',', $answer);                                  // tidy " ,"
$answer = preg_replace('/,\s*,/u', ',', $answer);                                 // tidy ",,"

echo json_encode(['answer' => $answer]);
