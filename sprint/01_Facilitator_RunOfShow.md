# The Gender Capital Lab™ Sprint — Facilitator Run-of-Show (v2)

**Product:** 24-hour proposition sprint — from a client's own data to a **tested** proposition: built with AI in the afternoon, tested with real target-group customers the same evening, decided the next morning.
**Pilot client:** BeFrank (digital pension provider, NL)
**The promise to the client:** *"Commit one day. By tonight, 3–5 AI-built prototypes have been tested with women from your own target group. Tomorrow at 09:00 you decide which one gets the pilot — on evidence, not opinion."*

This is the facilitator's operating manual. The format runs in three blocks: an **async pre-sprint week (T–7 → T–1)**, one long **sprint day (09:00–21:00)** ending in a live test panel, and a **next-morning readout & decision (09:00–10:00)**. Together they deliver the promise: **24 hours from insight to tested proposition.**

---

## 0. The pilot thesis (why BeFrank, why this works)

BeFrank's brand is *eerlijk*, *transparant*, *"een pensioen dat bij jou past."* The single most on-brand, most quantifiable opportunity sitting in their own data:

> **Dutch women retire with ~36–40% less pension than men — about €400 less every month — the second-largest gap in the EU.** Drivers: part-time work, career breaks, the pay gap, sector segregation. Most of these are *visible at the moment they happen* inside a pension administrator's own systems (salary change, hours change, parental leave, job switch).

A provider whose whole proposition is "a pension that suits you" is structurally positioned — and structurally obligated — to be the one that closes this gap. The sprint's job is to turn that thesis into a proposition that **real women from the target group have already validated** by the time the board sees it.

**House rule (carried from the Hei~Bos method): we make the business case, not the moral case.** Every claim in the room ties back to a number or a piece of BeFrank's own evidence. And in v2 we add a second house rule: **no opinion survives contact with the panel.** Whatever the room believes at 17:00, the women in the evening session decide what's true.

---

## 1. The team & roles

| Role | Who | Owns |
|---|---|---|
| **Lead facilitator** | Unlockt (Chantal / Britt) | The room, the timeboxes, the convergence decisions, the Phase 1 mirror narrative |
| **AI operator(s)** | Unlockt (commercial/tech lead, +1 per extra build pod) | The platform end-to-end: intake monitoring, research brief, findings page, build pods, evening note-capture, readout synthesis |
| **Panel host** *(new in v2)* | Unlockt | The evening: chases panel recruitment from T–7, owns the rotation schedule, hosts panellists 18:00–21:00, runs the 20:30 plenary, guards consent & incentives |
| **Client sponsor** | BeFrank exec (decision-maker) | Sets the mandate, **names the client-side panel-recruitment owner**, makes the Day-2 pilot call |
| **Client crew** | 4–6 BeFrank people | Mixed: product, data, marketing, client-facing, ideally 1 actuarial. Each completes the full intake; each observes a test station in the evening |

**Keep the client room to ≤8.** More than that and convergence dies. One decision-maker, not a committee. And note the evening commitment up front when booking: **the sprint day runs 09:00–21:00.** Anyone who can't stay for the panel shouldn't be in the crew.

---

## 2. Pre-sprint (T–7 → T–1) — intake & analysis

> Pre-work is the first commitment test. A sprint with no intake is a brainstorm, not a sprint. Protect this — and protect the panel recruitment above everything else.

### 2.1 The client crew's intake (per person, ±25 min, all via their platform link `/s/<token>/intake`)

Each crew member, independently, in one sitting:

1. **Registration + pre-work question** — name, role, and the shared question answered in 3 sentences: *"Where do you think BeFrank is leaving women's outcomes — and BeFrank's commercial outcomes — on the table?"* Surfaces divergence early.
2. **Self-assessment** — the 29 statements across the five dimensions (`02_Self_Assessment.md`), scored 0–4, rendered live as filling **percentage rings**. Independent answers, no conferring.
3. **AI interview** — a ±5-minute chat that digs for the story behind their answers: why did you score Data a 1? what's the example behind that 4? what do you suspect your colleagues scored differently? These pull-quotes become the crew's own voices in the Phase 1 mirror.
4. **Document uploads to the data room** — research, decks, board reports, journey audits, campaign evaluations, whatever they have. The AI reads and excerpts everything; nothing uploaded goes unused.

### 2.2 ⚠️ CRITICAL CHECKLIST ITEM — recruit the evening test panel (T–7)

**This is the single biggest logistical risk of the format. Without the panel, Phase 6 collapses and v2 degrades to an opinion workshop.**

- **What:** 6–8 women from the chosen target segment (e.g. *vrouwen 30–45 die recent minder zijn gaan werken*), **confirmed for 18:00–21:00 on sprint day**, incentive arranged (voucher/fee — client's choice, but arranged at recruitment, not promised vaguely).
- **Who:** a **named owner on the client side**, appointed by the sponsor at booking. Not "the team" — one person whose name is on the checklist. The Panel host chases this owner from T–7 onward.
- **Escalation rule:** if the panel is **not confirmed by T–3, the facilitator escalates to the sponsor directly.** Not the owner, the sponsor — this is a sponsor-level commitment.
- **Fallback:** internal women employees who match the segment profile (different employer-pension context, so a weaker signal — but still signal, and the readout flags it honestly).

### 2.3 What we do (platform side, T–7 → T–1)

- **Deep research** runs on the client + market. The web research brief covers: company snapshot, the inclusive-finance angle, competitor best practices (direct *and* indirect — banks, insurers, fintechs, foreign pension players), and the **hooks** — the 3–5 sharpest findable facts about this client and this gap.
- The **diagnostic engine** merges the crew's assessments: rings per dimension, the overall score, and the **divergence view** (where the crew disagrees with itself — usually where the opportunity hides).
- Everything — rings, divergence, interview pull-quotes, data-room excerpts, research brief — lands on the **findings page**: `/dashboard/[id]/findings`. The facilitator reviews it at T–2 and flags anything the AI got wrong before the room ever sees it.

### 2.4 T–1, 17:00 — send the pre-read

Send the findings page's print view (`?preread=1`), **max 2 pages**.

> **Rule: the pre-read is a teaser, not the reveal.** Scores summary + 3 hooks + tomorrow's agenda. Keep the full mirror — the divergence, the quotes, the quantified gap — for the room. If they've seen it all by email, Phase 1 has no turn in it.

**Go/no-go gate (T–1):** intakes complete (or ≥4 of crew), panel confirmed, findings page reviewed. If the panel is the gap, invoke the fallback now — don't hope.

---

## 3. Sprint day — the run of show

Each phase below: **objective · what happens · facilitator prompts · platform/AI action · output · timebox in the header.**

### Phase 1 · The Mirror — 09:00–10:00 (1 hour, sharp)

- **Objective:** show BeFrank themselves, in their own words and numbers. This is the emotional turn — earned in one hour, not stretched into a morning.
- **What happens:** the facilitator walks the findings page on screen, in this arc:
  1. **Their rings** — readiness per dimension — *and where the room disagrees with itself* (the divergence view: "three of you scored Data a 3; two scored it a 1 — someone in this room is wrong, and it matters which").
  2. **Their crew's own voices** — pull-quotes from the AI interviews, anonymised, verbatim.
  3. **What their data room told us** — excerpts and facts from their own uploads.
  4. **The market & competitor picture** — from the research brief; what direct and indirect players already do.
  5. **The evidence base** — the external numbers that frame it.
  6. **Ending on the quantified gap** — the gender pension gap applied to BeFrank's book ("X% of your female participants are on a trajectory ~€__/month below comparable men").
- **Script note: let their own material do the convincing. The facilitator narrates, never lectures.** Every slide is something *they* gave us or something *about them* — the room can't argue with its own evidence.
- **Facilitator prompts:** *"Which of these did you already know? Which is new? Where does it sting most?"*
- **Platform/AI:** findings page live on screen; nothing pre-printed beyond yesterday's teaser.
- **Output:** shared, undeniable picture of the gap. No decisions yet.
- **Watch for:** defensiveness. Keep it commercial, never accusatory — "money on the table," not "you failed women."

### Phase 2 · Goal of the day — 10:00–10:30 (30 min)

- **Objective:** fix the day's contract. Everything after this phase is execution against it.
- **What happens:** the facilitator writes the contract **on the wall** (literally — flip-over, marker, stays up all day):
  > **By 17:00:** 3–5 testable, AI-powered prototypes.
  > **Tonight 18:00–21:00:** tested with the target-group panel.
  > **Tomorrow 09:00:** results + pilot decision.
  Then the room chooses, with the sponsor holding the pen: the **target segment** (it must match the recruited panel — that decision was really made at T–7; today the room owns it out loud) and **one success metric** the prototypes will be ranked on tomorrow (e.g. *"% of panellists who say they'd act on this within a month"* or a contribution/engagement proxy).
- **Facilitator prompts:** *"If only one number from tonight could appear on tomorrow's decision slide, which number is it?"*
- **Platform/AI:** scribe function — segment + metric captured as structured fields; they drive tomorrow's ranking.
- **Output:** the day's contract on the wall: segment + one success metric + the three deadlines.
- **Watch for:** metric inflation ("and also NPS, and also…"). One metric ranks; the rest is colour.

### Phase 3 · Discovery — 10:30–12:30 (2 hours, four blocks of ~30 min)

- **Objective:** build the shared map the concepts will come from — needs, gaps, money, and proof that it's doable.
- **What happens — four blocks:**
  - **(a) Needs & insights of the target group** — panel personas, library evidence, the intake interview material. What do these women actually need at the moments that widen the gap?
  - **(b) Gaps & barriers we're targeting** — from the diagnostic and the data room. Where does BeFrank's current journey lose them?
  - **(c) Opportunities** — where is money left on the table, quantified where possible (segment size × effect × value). Rough numbers beat no numbers.
  - **(d) Best practices** — from the research brief: direct competitors *and* indirect ones (a neobank's salary-change nudge counts as evidence for a pension provider).
- **Output: the MOMENT × MECHANISM opportunity grid** — the day's central artefact, on the wall next to the contract:
  - **Moments (rows):** the life events where the gap widens — *parttime gaan, scheiding, geboorte, overlijden partner, baanwissel* (extend as the room finds more).
  - **Mechanisms (columns):** product · communication · default/choice-architecture · service · channel/ecosystem.
  - Each cell holds the evidence from blocks a–d that lands there. Hot cells (lots of evidence, big numbers, nobody serving them) glow by lunchtime.
- **Facilitator prompts:** *"Which cell has the most money and the least competition?" · "Which moment can BeFrank actually see in its own systems?"*
- **Platform/AI:** AI operator pulls evidence onto the grid live (interview quotes, data-room excerpts, research findings filed per cell).
- **Watch for:** the room camping in one favourite cell. The grid exists to show the whole field — defend its width; Phase 4 needs it.

### Phase 4 · Ideate & choose — 12:30–14:00 (90 min, through lunch — food in the room)

- **Objective:** 3–5 concepts chosen, each with a build brief the pods can execute cold.
- **What happens:**
  - **Diverge (30 min):** "How might we…" against the grid — silent generation first, then rounds. The AI co-facilitator injects provocations and role-plays the target-group woman ("Ik werk net 3 dagen — wat doet BeFrank nu voor mij?").
  - **Converge (30 min):** cluster, dot-vote, sponsor breaks ties — down to **3–5 concepts**.
  - > **THE DIVERSITY RULE: each chosen concept must occupy a DIFFERENT cell of the moment × mechanism grid.** Never five variants of one idea. Five flavours of the same nudge teaches the panel nothing; five different cells means tonight's test produces *signal* — which moment, which mechanism, actually moves this segment. The facilitator enforces this physically: walk to the grid, point at the cells, refuse a second concept in an occupied cell.
  - **Brief (30 min):** each concept gets a **build brief** (`BRIEF_TEMPLATE.md`) — one-liner, persona, journey moment, tone, constraints. The room splits across concepts to draft; the facilitator reads each brief aloud before locking. If it isn't in the brief, it doesn't get built.
- **Platform/AI:** ideation canvas; briefs saved as structured JSON, one per concept — the build pods' only input.
- **Output:** 3–5 locked briefs, each pinned to its grid cell.
- **Watch for:** convergence fatigue after lunch. Keep people standing, keep the grid in play, keep the 14:00 handoff hard.

### Phase 5 · AI build — 14:00–17:00 (3 hours, parallel pods)

- **Objective:** every concept testable by 17:00.
- **What happens:** **parallel build pods** — one facilitator/AI-operator per pod, 1–2 client crew members embedded (they supply domain truth and brand instinct; the operator drives the tools). Each pod delivers, per concept:
  1. **A clickable prototype** — enough screens to complete the test tasks; Mijn Pensioen-style where relevant. Depth in the test path, not breadth.
  2. **A one-line value proposition in the client's brand voice** (BeFrank: warm, direct, no jargon — in Dutch, it's client-facing): e.g. *"Minder gaan werken? Wij laten je meteen zien wat het je later kost — en hoe je het met één keuze dichtbij houdt."*
  3. **A test script** — **3 tasks + 4 questions**, standardised across stations (see Phase 6) so results compare.
- **16:30 — the dry-run gate:** every prototype must survive a **2-minute walk-through by someone who didn't build it.** Stuck, confused, or broken = fix in 30 minutes or invoke the contingency (cut to 3 concepts — see §5). Nothing untested-by-a-stranger goes in front of the panel.
- **Platform/AI:** prototyping tools per pod; the dashboard tracks pod status; QA red lines hold — every number traces to an input, nothing a regulator/AFM would flag (guidance, never advice; no guaranteed returns), all panel-facing copy in Dutch and in brand voice.
- **Output:** 3–5 stations ready: prototype + value-prop line + printed test script per station.
- **Watch for:** pods polishing screen 4 while screen 1 confuses. The dry-run gate exists to catch exactly this.

### Phase 6 · Test panel — 18:00–21:00 (3 hours; the heart of the format)

- **Objective:** real evidence per concept, from real women in the segment, captured well enough to rank tomorrow.
- **The evening (Panel host runs it):**
  - **18:00** — welcome, food, consent (recording/notes), incentive logistics confirmed. Warm, informal — this is *their* evening.
  - **18:30–20:15** — **rotation: 3 rounds × 15 min** (plus transitions and one break). 6–8 panellists in pairs or solo rotate over the prototype stations; the standard script runs identically at every station: 3 tasks, then the 4 questions.
  - **One client crew member observes per station** — observes, never sells, never explains. **The client hears their own customers struggle with, or light up at, their own prototype — that's the magic of the format.** The facilitator briefs observers at 17:45: *you may say hello and thank you; the prototype does the talking.*
  - **The 4 standard questions (Dutch, asked at every station):**
    1. *"Wat denk je dat dit voor je doet?"*
    2. *"Wanneer zou je dit gebruiken — bij welk moment in je leven?"*
    3. *"Wat houdt je tegen?"*
    4. *"Zou je dit aanraden aan een vriendin — waarom (niet)?"*
  - **AI captures notes/transcripts per round, per station** — operators run capture; nothing relies on observer memory.
  - **20:30 — panel plenary:** all panellists together, one closing question: ***"Welke zou je morgen gebruiken — en waarom?"*** A show of hands plus the why's. This is tomorrow's headline slide, in their words.
  - **21:00** — thank, pay/voucher, done. Crew goes home; the AI synthesis starts.
- **Output:** per prototype: task completion observations, answers to the 4 questions, plenary verdict, verbatim quotes.
- **Watch for:** crew members defending their prototype to a panellist. One warning, then the Panel host swaps them to a different station.

### Phase 7 · Readout & decision — next morning 09:00–10:00 (1 hour)

- **Objective:** a pilot decision, made on last night's evidence.
- **What happens:** the facilitator presents the synthesized test results, per prototype:
  1. **What landed, what fell flat** — task by task, question by question.
  2. **Verbatim panel quotes** — the panellists' own words carry the argument; the facilitator narrates, never lectures (same rule as Phase 1).
  3. **Ranking against the day's success metric** — the one number the room chose at 10:00 yesterday, now filled in with real data.
  4. **The decision: which proposition gets the pilot.** The sponsor calls it. The grid cell tells you *why* it won — which moment, which mechanism.
- **Platform/AI:** the **proposition deck is generated from the platform for the winner** (deck generator; dossier for the full evidence trail). The losing concepts' learnings go in the dossier — they're paid-for insight, not waste.
- **Facilitator's close:** *"Yesterday morning this was a hunch in your own data. Last night, eight women from your target group used it. The only question left is whether BeFrank wants to be the provider that ships it first."*
- **Output:** a decision, captured in the platform; winner's deck + dossier generated; pilot next-steps (the Advisory Trajectory, framed as the obvious continuation).

---

## 4. Materials & platform checklist

**Platform (live tools):**
- [ ] Client intake links generated and sent (`/s/<token>/intake`) — one per crew member; completion tracked on the dashboard.
- [ ] Dashboard monitored T–7 → T–1 (intake completion, data-room uploads, research-brief status).
- [ ] Findings page (`/dashboard/[id]/findings`) reviewed by the facilitator at T–2; AI errors corrected before the room sees it.
- [ ] Pre-read (`?preread=1` print view, max 2 pages) sent T–1 17:00.
- [ ] Deck & dossier generators tested with dummy data before sprint day (the Phase 7 morning has no slack for a broken generator).

**Room & evening:**
- [ ] Room for 09:00–21:00 confirmed — including the evening: 3–5 test stations (table + device + chairs), a plenary corner, food twice (lunch in the room, evening for the panel).
- [ ] Devices per station (the prototype must run on something a panellist would actually hold — phone-first for Mijn Pensioen-style concepts).
- [ ] Wall space: the day's contract + the moment × mechanism grid stay up all day.
- [ ] Whiteboard/paper, sticky notes, dot stickers, timer; printed test scripts per station.
- [ ] **Panel:** recruited at T–7 by the named client-side owner, confirmed by T–3, incentives arranged, consent forms ready, Panel host has every panellist's mobile number.

**People & legal:**
- [ ] Sponsor confirmed for the full sprint day **and** the next-morning readout; Day-2 approver confirmed.
- [ ] Crew confirmed for 09:00–21:00 (the evening is not optional).
- [ ] Data-processing terms signed; "client data is not used to train models" stated in writing; panel consent covers note-taking/transcription.

---

## 5. What can go wrong — contingencies

| Risk | Mitigation |
|---|---|
| **Panel no-shows** (the format's #1 risk) | Over-recruit: confirm 8 to net 6. Panel host calls every panellist at T–1 and at 16:00 on sprint day. Below 6: run with 4–5 and say so in the readout (smaller n, honest flag). Below 4: invoke the fallback — internal women employees matching the segment (weaker signal, still signal; never cancel Phase 6). Structural prevention: the T–3 escalation to the sponsor exists precisely so this is solved before sprint day. |
| **Prototype not ready at the 16:30 gate** | **Cut to 3.** A station that confuses panellists poisons its own data and wastes a rotation slot. Three clean prototypes in different grid cells beat five wobbly ones. The cut concept's brief goes in the dossier as a "build next" candidate. |
| **Client crew dominated by one voice** | The intake already armed you: independent assessments + AI interviews captured everyone's view *before* the loud voice could shape it. Quote the divergence view back to the room. Use silent rounds in Phases 3–4, dot-votes over discussion, and give the dominant voice a job (grid librarian, pod duty). The sponsor decides; nobody else gets a veto. |
| **AI tools down** | **Paper prototypes.** Sketched screens, printed flows, a human playing the system ("Wizard of Oz"). The panel still runs — panellists react to paper nearly as richly as to pixels. Note capture falls back to paper observation sheets per station; the readout is assembled by hand. The format survives; only the polish drops. |
| **Thin intake / empty data room** | Run the mirror on the self-assessments, interviews, and the research brief alone; flag every assumption explicitly. The quantified gap still works from public stats (EU/CBS) applied to the client's stated book size. |
| **Sponsor not empowered to decide** | Re-scope the Phase 7 ask before sprint day: "approve a 6-week pilot decision by [date]," not full commitment. Never discover this at 09:30 on Day 2. |
| **Tone drifts to DEI/moral** | Facilitator resets to the number. Always the number. |

---

**The promise, kept:** in 24 hours from insight to **tested** proposition.
