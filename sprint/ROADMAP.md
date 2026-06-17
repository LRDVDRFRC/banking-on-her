# Roadmap — sprint-ready in 24 hours

**Principle: the sprint runs on a toolkit, not a platform.** Everything needed to sell and run the first 24-hour sprint is a set of self-contained HTML tools and one script. No web app, no database, no deploys. The Next.js platform is deferred until the first paid sprint proves the format — software follows revenue, never the other way around.

## The clock

| When | What | Who |
|---|---|---|
| **Today** | Roadmap locked, backlog re-cut into "sprint-critical vs later" | done |
| **Tonight 21:00** | The scheduled agent builds ALL sprint-critical tools in one run | `ifc-sprint-builder` |
| **Tomorrow morning** | Toolkit is sprint-ready. 30-minute human review: click through each tool, flag fixes | you |
| **This week** | Internal dry run: push our own dummy data through intake → assessment → diagnostic → filled deck. Fix what snags | you + agent |
| **Next week** | Send the sales one-pager to BeFrank, confirm sponsor + crew, pick the sprint date. Client T–7 intake starts | you |
| **Sprint date** | The 24-hour sprint: insight in → proposition presented next morning | everyone |
| **After first paid sprint** | Only then: platform build (Next.js, Turso, dashboards) | later |

## Tool ↔ sprint-moment map

Every tool exists because a specific hour of the sprint needs it:

| Sprint moment | Tool | Status |
|---|---|---|
| Sell the sprint | `04_sales-onepager.html` | tonight |
| T–7 · client intake | `06_intake-pack.html` (data-room list, timeline, pre-work) | tonight |
| T–7 · self-assessment | `05_self-assessment-form.html` (0–4 sliders → % rings, JSON export) | tonight |
| T–3 · pre-compute scores | `07_diagnostic-engine.html` (merge JSONs → rings + divergence) | tonight |
| Day 1 · 09:00 mandate | captured in build brief | tonight (template) |
| Day 1 · 11:00 diagnose live | `07_diagnostic-engine.html` on screen | tonight |
| Day 1 · 13:00 pick the one | impact × feasibility matrix — whiteboard works; tool optional | paper fallback |
| Day 1 · 17:00 build brief | `BRIEF_TEMPLATE.md` + sample JSON | tonight |
| Overnight · AI build | Claude + `08_fill-deck.js` fills the deck tokens | tonight |
| Day 2 · 09:00 present | `03_proposition-deck.html` | **done** |
| Facilitation throughout | `01_Facilitator_RunOfShow.md`, `02_Self_Assessment.md` | **done** |

## Go/no-go to book BeFrank

Book the sprint date only when the dry run proves the chain end-to-end: dummy assessment JSONs → diagnostic rings → filled deck, all opening clean in a browser. That's a this-week milestone, not a six-week programme.

## What "later" means

`~/IFC/platform/` (Next.js + Turso) replaces the manual chain only when sprint #1 has paid and sprint #2 is booked. Until then every hour goes to selling and running, not to infrastructure.
