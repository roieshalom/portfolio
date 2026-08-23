# Portfolio — roiesh.com

Personal portfolio site for Roie Shalom (product design lead). Static HTML/CSS/JS, no framework.

## Deployment

- **Push to `main` → live at roiesh.com.** No build step, no CI.
- Other branches do not deploy. Use feature branches for in-progress work.

## File structure

```
index.html         # Homepage: intro paragraph + 3 featured tiles
work.html          # Combined gallery (Design Work + AI Projects sections)
about.html         # About text + experience list + CV download
contact.html       # Contact form via Formspree (https://formspree.io/f/mkoqgrwg)
styles.css         # Single stylesheet, ~500 lines, uses CSS custom properties
casestudy.css      # Styles for individual case study pages
data/projects.json # UX/design projects
data/experience.json # About-page experience list
ai/data/projects.json # AI side projects (thumbnails use ../content/ path prefix)
content/           # Images and assets
ai/                # AI side-project pages (grooped.html, etc.)
```

Per-project case study pages are top-level: `wayfair.html`, `eqcapture.html`, `esmeralda.html`, `grooped.html`.

## Key CSS tokens (styles.css `:root`)

- `--max-width: 840px`
- `--spacing-section: 36px`
- `--radius-card: 16px`
- Colors: `--color-bg`, `--color-text-main`, `--color-text`, `--color-link` (`#f21783`), `--color-border`, `--color-card`
- Dark theme defined under `html[data-theme="dark"]`

## Conventions

- **No em-dashes (—) in any copy or text.** Use commas, periods, or rephrase. Same applies to written explanations to the user.
- Write in first person where appropriate.
- Sound human, not corporate.
- Static site, no framework. Vanilla JS only.

## Notable JS behaviors

- **Random brand font** (`index.html` inline + `name-animator.js`): each pageload picks a random typeface for "Roie Shalom" wordmark from a hardcoded list.
- **Tile hover tints background** (`index.html` inline): hovering a featured tile tints `--color-bg` toward that project's `data-color`. Mouse-only.
- **Tile click transition** (`index.html` inline): clicking a tile animates it scaling to fill the hero of the destination page before navigating.
- **PIN unlock** (`pin-unlock.js`, `access.js`): protected projects gated by 4-digit code. Unlocked state persists in localStorage.
- **Theme toggle** (`theme.js`): light/dark via `data-theme` on `<html>`.
- **MS Clarity** is loaded in `<head>` of index.html for analytics.

## Git workflow

- Push freely to feature branches.
- **Confirm before pushing to `main`** — pushes go live immediately.
- User sometimes edits files directly between turns; system-reminders flag this.

## Active feature branches

- `feature/homepage-design-notes-overlay` — adds a "Design notes" toggle button that overlays numbered dots on annotated UI elements with explanatory popovers. Touch devices tap-to-toggle, mouse devices hover. Not merged. Pushed to origin.

## Backlog

- `project_low_prio_backlog.md` — things to revisit when there's time (if file exists at repo root).
