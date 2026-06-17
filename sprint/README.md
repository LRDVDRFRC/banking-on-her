# Gender Capital Lab™ Sprint — Phase 0 Kit

The "run it on rails" kit: everything you need to **sell and facilitate one real 24-hour proposition sprint** before any platform is built. Pilot client: **BeFrank** (closing the gender pension gap).

> The product in one line: *commit one day — by tonight, 3–5 AI-built prototypes have been tested with women from your own target group; tomorrow morning you pick the pilot on evidence.* It's the dramatic front door to the Advisory Trajectory.

## The 24-hour arc (v2 — see `01_Facilitator_RunOfShow.md` for the full phased run-of-show)

| Phase | When | Output |
|---|---|---|
| Intake & analysis (async) | T–7 → T–1 | AI interviews + data room + self-assessment + deep research → findings pack; **panel recruited** |
| Pre-read goes out | T–1 · 17:00 | 2-page teaser (scores summary + 3 hooks + agenda) |
| 1 · The Mirror | Day 1 · 09:00 | Findings presented back in one sharp hour |
| 2 · Goal of the day | Day 1 · 10:00 | Locked: 3–5 testable prototypes by 17:00, tested tonight |
| 3 · Discovery | Day 1 · 10:30 | Needs, barriers, opportunities, competitor best practices → moment × mechanism map |
| 4 · Ideate & choose | Day 1 · 12:30 | 3–5 diverse concepts (each a different moment × mechanism) |
| 5 · AI build | Day 1 · 14:00 | Clickable prototype + value prop + test script per concept |
| 6 · Test panel | Day 1 · 18:00–21:00 | 6–8 target-group women test every prototype |
| 7 · Readout & decision | Day 2 · 09:00 | Overnight synthesis → pick the pilot winner |

## Files

| File | What it is | How to use |
|---|---|---|
| `01_Facilitator_RunOfShow.md` | The facilitator's operating manual — hour-by-hour, roles, scripts, overnight build checklist, contingencies. | Read it before the sprint. Run the day from it. |
| `02_Self_Assessment.md` | The 5-dimension readiness self-assessment + percentage scoring rubric (scores shown as filling rings). This *is* the Readiness Scan. | Each client crew member fills it in at T–7. |
| `03_proposition-deck.html` | **The Day-2 proposition deck (primary deliverable).** Self-contained HTML in the Prism brand — 12 slides, scroll-snap, nav dots, keyboard navigation, print-ready (⌘P → one slide per page). | Open in a browser, or serve the folder. Swap `«tokens»` for real data. |
| `03_generate-sprint-deck.js` | Optional PowerPoint export of the same deck, for clients that insist on .pptx. | `cd /Users/jvanwaveren/IFC && node sprint/03_generate-sprint-deck.js` |
| `04_sales-onepager.html` | CFO-facing sales page (Dutch) that books the sprint. | Fill `«investering»` + contact tokens, send to BeFrank. |
| `05_self-assessment-form.html` | Interactive self-assessment (Dutch): 29 statements, live % rings, JSON export. | Client crew fills it at T–7, returns the JSON. |
| `06_intake-pack.html` | Client pre-sprint page (Dutch): timeline, data-room checklist, pre-work question, privacy. | Send after booking. |
| `07_diagnostic-engine.html` | Facilitator tool: merge assessment JSONs → readiness rings + divergence view + copy-scores block. | T–3 pre-compute and the Day-1 11:00 live reveal. |
| `BRIEF_TEMPLATE.md` + `sample-build-brief.json` | The Day-1 17:00 build brief (room → machine handoff). | Fill during the ideation close. |
| `08_fill-deck.js` + `sample-sprint-data.json` | Presentation Builder: fills the deck's tokens + rings from sprint data. | `node 08_fill-deck.js <data.json> [out.html]` overnight. |
| `DEMO.md` | The full chain, clickable in 5 minutes with demo data. | Start here for the dry run. |
| `ROADMAP.md` / `BACKLOG.md` | The plan (sprint-ready in 24h, platform deferred) and the agent work queue. | — |

The deck runs: mandate → diagnose (readiness rings) → quantified opportunity → the proposition → persona → journey → business case → comms → prototype → roadmap → decision.

## Reusing this for the next client

The five dimensions and the run-of-show are client-agnostic. To re-point the kit:
1. Swap the pilot thesis in `01_…` §0 for the new sector's quantified opportunity.
2. Re-localise the question wording in `02_…` (keep the 0–4 scoring and percentage rollup).
3. In `03_proposition-deck.html`, change the `.logo` line, the proposition slides, and refill the `«tokens»` (same edits in the optional `.js` export if you use it).

Everything marked `«token»` is what the Build Engine fills from the client's own data overnight. Numbers marked *(illustratief)* are placeholders for the worked example.

## What's next (beyond Phase 0)

Phase 1 turns the manual kit into software: intake + self-assessment + a Diagnostic Engine that auto-computes the readiness scores, then the same deck generator as the Presentation Builder. Phase 2 adds the AI Build Engine. See the system design for the full module map.
