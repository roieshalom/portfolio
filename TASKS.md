# Portfolio tasks

Running list of outstanding work on roiesh.com. Most of this came out of the
"State of UX Portfolios 2026" portfolio review (Oct 2026). Kept in one file so
nothing gets lost across branches.

## Now / in progress

- **Wayfair case study** is live at roiesh.com/wayfair (rebuilt directly into
  `wayfair.html` on `main`). The old `wayfair-new.html` draft on branch
  `feature/wayfair-case-study-format` is superseded. Copy fixes (em-dash,
  missing full stop, hyphenation) are done and live. Remaining, from the
  Oct 24 in-browser review:
  - [ ] **Privacy in the usability-session image** (live on the page now). It
    shows a participant's face and full name plus a live meeting code. Confirm
    consent or blur the face, name and meeting ID.
  - [ ] **Remove the "placeholder only" text** baked into the validation-spec
    image ("Text here is a placeholder only. All types and correct copy are
    elaborated here"). 51% of reviewers notice placeholder copy (UXfolio 2026,
    ch. 2.4).
  - [ ] **Make the dense images readable.** The journey map, the validation
    spec and the four legacy-tool screenshots are plain figures with no zoom,
    so they're unreadable at page width. Add click-to-zoom, enlarge them, or
    show a readable crop.
  - [ ] (Optional) Differentiate repeated section eyebrows (two "Discovery",
    two "Development"), and give the text-only Delivery section a small rollout
    visual.

## Later (agreed, not started)

- [ ] **Trim the main "Selected work" list to 5.**
  Keep: Unified Order Entry (Wayfair), EQ Capture, Search Redesign, Grooped,
  OnPaper. Remove Ask Esmeralda from the main list (it moves to the AI area
  below). Edit the `FEATURED` array in `index.html` and the `workCount`.
  Why: reviewers prefer 3 to 4 projects; the first items should be the most
  relevant (UXfolio 2026, ch. 3.3, 3.2).

- [ ] **Dedicated AI area (new section).** A lighter section, separate from the
  main case studies, for the AI / side builds. Contents: Grooped, OnPaper, Ask
  Esmeralda, Capimathe, plus one more project (to add). Short entries with live
  links, not full case-study rows.

- [ ] **Gate the NDA project pages.** Right now the homepage locks the three NDA
  rows (PIN 2026 / 7816 via `access.js`), but the project pages themselves
  (`wayfair.html`, `eqcapture.html`, `search.html`) have no gate, so a direct
  URL bypasses the lock. Plan: show the PIN prompt on the page itself (not a
  redirect). Keep the header and its allowed/public data visible, blur the
  protected content, and reveal it when the PIN is entered.
  Why: a leaking "NDA" gate undercuts trust; missing/failing passwords stop 61%
  of reviews (UXfolio 2026, ch. 2.2).

- [ ] **Project status labels.** Add a Status field to each project page header,
  and update the homepage preview (it currently shows "NDA" / "Live").
  Values: Wayfair = Shipped; EQ Capture = Shipped, later sunset; Search =
  Proposal. Bundle this with the gate/header work above.
  Why: not showing outcome is a weakness for 43%; honesty beats inflation
  (UXfolio 2026, ch. 4.2).

## Decided, no action needed

- **Hero load / fade-in:** keep as-is (per Roie).

## Open checks (from the review, low effort to confirm)

- [ ] Confirm the CV (downloadable PDF) and LinkedIn match the About-page
  experience timeline (roles, titles, dates). UXfolio 2026, ch. 1.6.
- [ ] Confirm the hero fade-in is a sub-second flash on a normal connection,
  not a longer hang on slow ones.

## Facts to nail down (for interviews / to stand behind)

- [ ] Source behind the Wayfair numbers (3,400 migrated, 5% reversion, ~2% order
  dip).
- [ ] Source behind the EQ Capture "about 50%" / capture-time figures.

## Loose ends noticed in the repo (decide what to do)

- [ ] "Collin" conversational-agent files are untracked (`collin.md`,
  `design/collin/replace-clippy-prompt.md`). Separate workstream. Decide where
  they belong.
- [ ] Stale branch `feature/wayfair-case-study-format` still holds files not on
  `main`: `tools/edit-server.py`, the Esmeralda images and the `.af` design
  sources. Port anything worth keeping before deleting the branch.
