# DEMO — the full sprint chain in 5 minutes

How to click through a complete simulated sprint, end to end, with no client data. Serve the folder first:

```bash
cd /Users/jvanwaveren/IFC && python3 -m http.server 8096
# then open http://localhost:8096/sprint/
```

## The chain

**1. Sell it — `04_sales-onepager.html`**
The CFO-facing pitch. This is what goes to BeFrank to book the date. Tokens to fill before sending: `«investering»`, `«contactpersoon»`, `«e-mail»`, `«telefoon»`.

**2. Client intake (T–7) — `06_intake-pack.html`**
What the client crew receives after booking: the timeline, the data-room checklist, the pre-work question, the privacy guarantees, and the link to the self-assessment.

**3. Self-assessment — `05_self-assessment-form.html`**
Play a crew member: fill in a name, answer all 29 statements (0–4), watch the rings fill live, then **Download JSON**. Repeat 2–3 times under different names with different answers to simulate a crew.

**4. Diagnose — `07_diagnostic-engine.html`**
Facilitator tool. Drag the downloaded JSONs in (or click **Load demo data** for 3 built-in respondents). You get: merged readiness rings per dimension, the overall score + band, the divergence view ("the room disagrees here — that's where the conversation is"), and the respondent table. Click **Copy scores block** — that's the input for step 5. On the sprint day, this screen IS the 11:00 live diagnose reveal.

**5. Build the deck — `08_fill-deck.js`**
Paste the copied scores into a sprint-data JSON (see `sample-sprint-data.json` for the shape; add the business-case numbers as they land), then:

```bash
cd /Users/jvanwaveren/IFC/sprint
node 08_fill-deck.js sample-sprint-data.json demo-filled-deck.html
```

The script fills the rings (with band colours), the totaaloordeel, the datum, and every business-case token it has a value for — and reports exactly which tokens remain. Overnight, this is the Presentation Builder step.

**6. Present — `demo-filled-deck.html`**
Open it: the Day-2 boardroom deck, filled. Arrow keys to navigate, ⌘P for a one-slide-per-page PDF.

**7. The brief that drives the overnight build — `BRIEF_TEMPLATE.md` + `sample-build-brief.json`**
The Day-1 17:00 handoff artifact: what the room locked, in a shape the AI build can execute.

## Verified 2026-06-10

The whole chain ran clean: sample data → fill-deck → filled deck rendering 52/68/48/30/45% rings, "49% — latent" totaaloordeel, datum on both end slides, 7 «X» tokens correctly left for missing client data. All four HTML tools load with zero console errors.
