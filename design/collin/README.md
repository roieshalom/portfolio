# Collin, AI chat agent

A floating chat button that answers visitor questions about Roie. Live on the
homepage (`/index.html` includes the widget) with the backend hosted here under
`/design/collin/`. Collin replaces the earlier Clippy widget. Clippy's files stay
in place under `/design/clippy/` so rollback is a one-line change (see below).

## How it runs

Static site + one PHP endpoint. The widget (browser) POSTs the conversation to
`chat.php`, which holds the Anthropic key server-side, calls the Claude API with
`system-prompt.md` as a cached system prompt, and returns the answer. No backend
framework, no build step.

```
visitor -> ai-helper.js --POST /design/collin/chat.php--> Anthropic API
                                    |
                                    +- logs Q&A to Airtable (after reply)
                                    +- enforces caps + rate limit
```

## Files (in this folder)

- `ai-helper.js` - the whole widget: a circular chat launcher (no mascot),
  entrance, chat panel, suggested-question chips, Clarity events. Loaded on the
  homepage via `<script src="/design/collin/ai-helper.js">`. Uses absolute paths,
  so it works from any page. Styled with the site's own CSS tokens, so it follows
  light and dark themes.
- `chat.php` - backend. Key resolution, rate limit + daily spend cap, Claude call
  (prompt caching), em/en-dash stripping, Airtable logging.
- `system-prompt.md` - Collin's persona + all of Roie's material. **Edit this to
  change what Collin says**, then push. It is the source of truth for answers.
- `collin.md` - the maintained knowledge base and persona reference that
  `system-prompt.md` is assembled from. Part 2 is the only source of facts;
  Part 3 overrides Part 2 where they disagree.
- `knowledge.json` - only powers the suggested-question chips and the offline
  fallback answers (used if the backend is unreachable). Not the LLM prompt. All
  facts here come from `collin.md`.
- `index.html` - standalone concept page at `/design/collin/` (homepage clone).
  The production widget is on the real `/index.html`; this page is for testing.

## Secrets / runtime files (on the host only, git-ignored, web-blocked)

Create these in this folder on the server (Hostinger File Manager). They never go
in git and are denied over the web via `design/.htaccess`.

- `.anthropic-key` or `apikey.txt` - the Anthropic API key (`sk-ant-...`). Also
  reads env `ANTHROPIC_API_KEY`. From a dedicated Anthropic **workspace** with a
  monthly spend cap.
- `airtable.json` - `{"token":"pat...","base":"app...","table":"..."}`. Collin
  logs to its **own table**, separate from Clippy's, so the two conversations do
  not blend. Token is an Airtable PAT with `data.records:write`.
- `.usage.json` - auto-created; tracks the daily spend tally. Do not edit.

## Key resolution order (in `chat.php`)

The key is read from the first source that has it:

1. `ANTHROPIC_API_KEY` environment variable
2. `design/collin/.anthropic-key`
3. `design/collin/apikey.txt`
4. `design/clippy/.anthropic-key` (fallback)
5. `design/clippy/apikey.txt` (fallback)

Collin's own paths come first. The Clippy paths stay last as a fallback so Collin
works even before a separate key is created, and so rollback needs no key change.
The missing-key error names the Collin path.

## Model + cost controls (in `chat.php`)

- Model: `claude-sonnet-5` (`$MODEL`, or env `AIH_MODEL`). Unchanged from Clippy.
- Daily spend cap: ~$0.55 / ~EUR 0.50 (`$DAILY_CAP_USD`, or env `AIH_DAILY_CAP`,
  USD). Unchanged from Clippy. Collin's system prompt is longer, but prompt
  caching covers most of the repeated cost; on cold-cache days the cap is simply
  reached in fewer calls. When hit, Collin says he is done for the day and stops
  calling the API until UTC midnight.
- Per-IP rate limit: 4 requests / 60s (`$RATE_MAX` / `$RATE_WINDOW`).
- Message length cap 800 chars; history capped at 12 messages.

## Logging

- **Airtable**: each Q&A logs Question, Answer, Model, Device, City, Country,
  Timestamp to Collin's own table. Self-healing: unknown columns are dropped, so
  add columns anytime. Location is approximate (IP geo via ipapi.co); the raw IP
  is not stored.
- **Clarity custom events**: `collin_shown`, `collin_opened`, `collin_question`,
  `collin_dismissed`. Appear in Clarity under Smart events as "Defined by: API"
  after processing (up to ~2h). Only fire on the live site (skipped on localhost
  and on sessions with `localStorage.block_clarity = "true"`). These are a fresh
  funnel under the new name; Clippy's old `clippy_*` series is left untouched.

## Common changes

- Change what Collin says -> edit `system-prompt.md`, push.
- Change the chips or offline answers -> edit `knowledge.json`, push.
- Change model -> `$MODEL` in `chat.php` (or `AIH_MODEL` env), push.
- Change daily cap -> `$DAILY_CAP_USD` (or `AIH_DAILY_CAP` env).
- Rotate the key -> replace `.anthropic-key` on the host (no push needed).

## Roll back to Clippy (one line)

In `/index.html`, point the widget script back at Clippy:

```html
<script src="/design/clippy/ai-helper.js"></script>
```

Nothing under `/design/clippy/` was changed, so that single line restores the old
widget exactly, key and Airtable config included.

## Notes

- The backend physically lives under `/design/collin/` even though the widget is
  on the main homepage. To relocate to a clean path later, move these files plus
  the host-only secret files together.
