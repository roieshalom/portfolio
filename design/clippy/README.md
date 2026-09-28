# Clippy — AI chat assistant

A paperclip mascot that answers visitor questions about Roie. Live on the
homepage (`/index.html` includes the widget) with the backend hosted here under
`/design/clippy/`.

## How it runs

Static site + one PHP endpoint. The widget (browser) POSTs the conversation to
`chat.php`, which holds the Anthropic key server-side, calls the Claude API with
`system-prompt.md` as a cached system prompt, and returns the answer. No backend
framework, no build step.

```
visitor ─▶ ai-helper.js ──POST /design/clippy/chat.php──▶ Anthropic API
                                     │
                                     ├─ logs Q&A to Airtable (after reply)
                                     └─ enforces caps + rate limit
```

## Files (in this folder)

- `ai-helper.js` — the whole widget: Three.js 3D paperclip (SVG fallback),
  entrance, gaze/blink/gag, chat panel, Clarity events. Loaded on the homepage
  via `<script src="/design/clippy/ai-helper.js">`. Uses absolute paths, so it
  works from any page.
- `chat.php` — backend. Key resolution, rate limit + daily spend cap, Claude
  call (prompt caching), em/en-dash stripping, Airtable logging.
- `system-prompt.md` — Clippy's persona + all of Roie's material. **Edit this to
  change what Clippy says**, then push. It is the source of truth for answers.
- `knowledge.json` — only powers the two suggested-question chips and the offline
  fallback answers (used if the backend is unreachable). Not the LLM prompt.
- `index.html` — standalone concept page at `/design/clippy/` (homepage clone).
  The production widget is on the real `/index.html`; this page is for testing.
- `tune.html` — dev-only tool to tune the paperclip proportions.

## Secrets / runtime files (on the host only, git-ignored, web-blocked)

Create these in this folder on the server (Hostinger File Manager). They never
go in git and are denied over the web via `design/.htaccess`.

- `apikey.txt` — the Anthropic API key (`sk-ant-…`). Also reads env
  `ANTHROPIC_API_KEY`. From a dedicated Anthropic **workspace** with a monthly
  spend cap.
- `airtable.json` — `{"token":"pat…","base":"apprykn5o7hHl8tCE","table":"tbltFlPkCtkSguR9g"}`.
  Token is an Airtable PAT with `data.records:write`.
- `.usage.json` — auto-created; tracks the daily spend tally. Do not edit.

## Model + cost controls (in `chat.php`)

- Model: `claude-sonnet-5` (`$MODEL`, or env `AIH_MODEL`).
- Daily spend cap: ~€0.50 (`$DAILY_CAP_USD`, or env `AIH_DAILY_CAP`, USD). When
  hit, Clippy gives a nap excuse and stops calling the API until UTC midnight.
- Per-IP rate limit: 4 requests / 60s (`$RATE_MAX` / `$RATE_WINDOW`).
- Message length cap 800 chars; history capped at 12 messages.
- Anthropic Console: the key's **workspace** has a $4/month cap; org limit $200.

## Logging

- **Airtable**: each Q&A logs Question, Answer, Model, Device, City, Country,
  Timestamp. Self-healing — unknown columns are dropped, so add columns anytime.
  Location is approximate (IP geo via ipapi.co); the raw IP is not stored.
- **Clarity custom events**: `clippy_shown`, `clippy_opened`, `clippy_question`,
  `clippy_dismissed`. Appear in Clarity under Smart events as "Defined by: API"
  after processing (up to ~2h). Only fire on the live site (skipped on localhost
  and on sessions with `localStorage.block_clarity = "true"`).

## Common changes

- Change what Clippy says → edit `system-prompt.md`, push.
- Change model → `$MODEL` in `chat.php` (or `AIH_MODEL` env), push.
- Change daily cap → `$DAILY_CAP_USD` (or `AIH_DAILY_CAP` env).
- Rotate the key → replace `apikey.txt` on the host (no push needed).
- Remove Clippy from the homepage → delete the `ai-helper.js` `<script>` line in
  `/index.html`.

## Notes / limitations

- Recordings: the mascot is a WebGL canvas, which Clarity cannot replay (shows
  blank). The chat panel is DOM and records fine.
- The backend physically lives under `/design/clippy/` even though the widget is
  on the main homepage. To relocate to a clean path later, move these files plus
  the host-only secret files together.
