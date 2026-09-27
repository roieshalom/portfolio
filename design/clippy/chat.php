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
$MODEL       = getenv('AIH_MODEL') ?: 'claude-sonnet-5';
$MAX_TOKENS  = 400;
$MAX_MSG_LEN = 800;   // per user message
$MAX_HISTORY = 12;    // messages accepted from the client

function fail($status, $message) {
  http_response_code($status);
  echo json_encode(['error' => $message]);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  fail(405, 'Method not allowed');
}

// --- resolve API key ---
$apiKey = getenv('ANTHROPIC_API_KEY');
if (!$apiKey) {
  $keyFile = __DIR__ . '/.anthropic-key';
  if (is_readable($keyFile)) {
    $apiKey = trim(file_get_contents($keyFile));
  }
}
if (!$apiKey) {
  fail(500, 'Server is missing its API key. Set ANTHROPIC_API_KEY or create design/clippy/.anthropic-key.');
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

echo json_encode(['answer' => $answer]);
