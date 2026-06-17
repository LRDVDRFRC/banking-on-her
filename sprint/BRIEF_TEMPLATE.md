# Build Brief — Template

**Internal facilitator material.** This is the structured brief the room fills during the 14:30 ideation block and locks at **Day 1 · 17:00**. It is the only input the overnight Build Engine gets — if it isn't in the brief, it doesn't get built. Write it so a stranger (or a model) could execute it cold.

**Rules of the brief:**
- Every field filled in the room, projected on screen, agreed out loud. The scribe types; the room watches.
- One proposition. One persona. One journey moment. Convergence already happened at 13:00 — the brief is not the place to reopen it.
- Numbers reference the data room or a cited stat. Unknown numbers stay as `«tokens»` — the build keeps them visible, never invents them.
- Client-facing copy is Dutch; this brief and the build pipeline run in English.

---

## 1. Sprint mandate

The one-sentence mandate signed at 09:00. Copy it verbatim — do not improve it.

> _____________________________________________________________________________

## 2. Success metrics

The 1–3 numbers the sponsor said must move. Each one measurable, each with a horizon.

1. _____________________________________________________________________________
2. _____________________________________________________________________________
3. _____________________________________________________________________________

## 3. The proposition

**Name** (what it will be called on the Day-2 deck):

> _____________________________________________________________________________

**One-liner** (what it does, for whom, at which moment — one sentence, no commas hiding a second idea):

> _____________________________________________________________________________

## 4. Target persona

Grounded in the data room, not invented. One real-feeling person, not a segment.

- **Name:** ______________________
- **Age:** ______________________
- **Situation** (2–3 sentences: work, life, relationship with their pension):

  _____________________________________________________________________________

  _____________________________________________________________________________

- **Quote** (one line in her own words — the sentence the room kept repeating):

  > "___________________________________________________________________________"

## 5. The journey moment

The exact life-event moment the proposition intervenes at — the trigger that is visible in the client's own systems (e.g. hours change, parental leave, salary drop, job switch).

> _____________________________________________________________________________

## 6. Must-have artifacts

Tick what the overnight build must deliver. Default: all five.

- [ ] **concept** — value prop, core concept, why it beats the status quo
- [ ] **journey** — current vs proposed journey at the trigger moment
- [ ] **businesscase** — segment size, expected effect, upside, cost of inaction (assumptions visible)
- [ ] **comms** — positioning line + sample message at the trigger moment, in client voice
- [ ] **prototype** — clickable concept screen (Mijn Pensioen-style)

## 7. Tone

How every client-facing word must sound. For BeFrank: **warm, direct, no jargon.**

> _____________________________________________________________________________

## 8. Hard constraints

Budget, regulatory (AFM — guidance, never advice; no guaranteed returns), tech, brand. Anything the build must not violate.

1. _____________________________________________________________________________
2. _____________________________________________________________________________
3. _____________________________________________________________________________

---

## The machine-readable brief (JSON schema)

The scribe captures the agreed fields in exactly this structure and saves it as `build-brief.json`. The Build Engine executes this file — see `sample-build-brief.json` for a filled example.

```json
{
  "version": 1,
  "mandate": "one-sentence sprint mandate",
  "successMetrics": ["..."],
  "proposition": { "name": "...", "oneliner": "..." },
  "persona": { "name": "...", "age": 0, "situation": "...", "quote": "..." },
  "journeyMoment": "the life-event moment the proposition intervenes at",
  "artifacts": ["concept", "journey", "businesscase", "comms", "prototype"],
  "tone": "BeFrank: warm, direct, no jargon",
  "constraints": ["..."]
}
```

---

## How to run the 17:00 handoff (15 min)

1. **Read the brief aloud** — the whole thing, top to bottom, slowly. The room hears what the build will actually do, not what they think they agreed.
2. **Fix on the spot.** Any "yes, but…" gets edited into the brief immediately, then re-read. No verbal side agreements — if it isn't in the JSON, it doesn't exist tonight.
3. **The sponsor confirms, verbatim:** *"If we build exactly this overnight, is tomorrow morning a yes?"* Get the verbal yes — eyes on the sponsor, not the room.
4. **Lock it.** Save the JSON, no edits after the room empties. The client goes home; the build starts.
