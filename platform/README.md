# Unlockt — Gender Capital Lab™ Sprint Platform

Web platform for the Unlockt **24-hour proposition sprint** (pilot: BeFrank).
It runs the whole format: async pre-sprint intake & analysis → the morning
"mirror" → ideation → AI-built prototypes → an evening test panel → the
next-morning readout & decision.

- **Client crew** (Dutch): intake (name, role, pre-work question), document
  uploads, the 29-statement readiness self-assessment with live percentage
  rings, and a short AI interview that digs for the story behind the scores.
- **Facilitator** (English): create sprints, run deep research, review the
  findings page, run the ideation canvas, build prototypes, host the evening
  test stations, and generate the readout.

Stack: **Next.js 15** (App Router, TypeScript) · **libSQL/Turso** · the
**Anthropic API** (`claude-opus-4-8`) · deployed on **Vercel**. No other
runtime dependencies — plain CSS, no UI framework.

---

## Production

Live: **https://ifc-sprint-platform.vercel.app**

- Vercel project `ifc-sprint-platform`; Turso DB `ifc-sprint` (`aws-eu-west-1`, Ireland — EU data residency).
- Facilitator routes (`/`, `/dashboard/*`, `/research*`, `/api/library`, `/api/ask`) sit behind HTTP basic auth (`BASIC_AUTH_USER` / `BASIC_AUTH_PASS`).
- Client routes (`/s/<token>/…`) are gated only by the unguessable per-sprint token — share these with the client crew; never put them behind the login.
- Deploy: `vercel deploy --prod --yes` from this folder (the Vercel CLI uploads the working tree; the Vercel env vars supply the secrets). The repo is also git-connected, so a push to `main` can trigger a build too.

---

## Rebuild from zero

Everything needed to stand this up on a fresh machine:

```bash
git clone https://github.com/LRDVDRFRC/banking-on-her.git
cd banking-on-her/platform   # the Next app lives in the platform/ subdirectory
npm install
cp .env.example .env.local   # then paste your ANTHROPIC_API_KEY (see below)
npm run seed                 # creates the schema + demo sprints in local.db
npm run dev                  # http://localhost:3000
```

Node 20+ (developed on Node 24), npm. No global tools required for local dev;
`vercel` and `turso` CLIs are only needed for production deploys/backups.

### Environment variables

| Var | Where | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | `.env.local` (local), Vercel env (prod) | Powers the AI interview, document analysis, deep research, Ask-the-library, prototype build, pre-read and readout. Without it, those features show a setup note and the rest of the app still works. |
| `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` | unset locally (falls back to `file:local.db`), set in Vercel env (prod) | Production database. |
| `BASIC_AUTH_USER` + `BASIC_AUTH_PASS` | unset locally (auth off in dev), set in Vercel env (prod) | Facilitator login. With `BASIC_AUTH_PASS` unset, the facilitator routes are open — fine for local dev. |

**Secrets never live in git.** `.env*` is gitignored; access is always via
`process.env`. See `.env.example` for the shape.

---

## The flow, route by route

| Phase | Route | What |
|---|---|---|
| Create | `/` | Facilitator home: sprint list + new-sprint form (client, date, sector, region, website) |
| Intake (T–7) | `/s/<token>/intake` | Client: registration + pre-work + **document uploads** (AI reads & excerpts each) |
| Intake | `/s/<token>/assessment?p=<id>` | Client: 29-statement self-assessment, live rings |
| Intake | `/s/<token>/interview?p=<id>` | Client: short AI interview, pull-quotes feed the findings |
| Analysis | `/dashboard/<id>` | Facilitator cockpit: merged rings, divergence, benchmark, data room |
| Analysis | `POST /dashboard/<id>/research` | Deep research (web-search-backed) → market & competitor brief |
| **Mirror (09:00)** | `/dashboard/<id>/findings` | The keystone: scores + crew voices + data room + market + evidence + goal |
| Pre-read (T–1) | `/dashboard/<id>/findings?preread=1` | AI-composed Dutch teaser; `POST …/preread` to (re)compose |
| **Canvas (12:30)** | `/dashboard/<id>/canvas` | Moment × mechanism grid; `POST …/canvas/suggest` for AI concept seeds; diversity check |
| **Build (14:00)** | `/dashboard/<id>/concepts/<cid>` | Per concept; `POST …/build` → value prop + phone-frame mock + test script |
| **Test (18:00)** | `/s/<token>/test/<cid>` | Tablet test view (client-token gated); `POST /api/feedback` captures panelist reactions |
| **Readout (+1)** | `/dashboard/<id>/readout` | `POST …/readout/generate` synthesizes the panel into a ranked recommendation |
| Deliverables | `/dashboard/<id>/{deck,dossier,briefing,export}` | Day-2 deck, client evidence dossier, facilitator briefing, raw JSON |
| Library | `/research`, `/research/<id>`, `/research/ask` | Evidence base + AI Q&A grounded in stored reports |

`GET /api/library?format=md|json` serves the evidence base to any AI (same
filters as `/research`; behind the facilitator auth).

---

## Database

Local dev uses `file:local.db` (gitignored). `lib/db.ts` owns the schema:
`CREATE TABLE IF NOT EXISTS` for every table plus idempotent `ALTER TABLE`
migrations (duplicate-column errors are swallowed), so the schema self-heals
on first request against any database — including production after a deploy
that adds tables. Tables: `sprints`, `participants`, `assessments`, `scores`,
`research_reports`, `documents`, `concepts`, `feedback`.

> `npm run seed` **drops and re-creates the demo data** — never run it against
> production. `npm run import-research` (idempotent) loads the 12 verified
> research reports from `research-seed.json`.

### Backups

`npm run backup` snapshots **production** to a timestamped JSON file under
`backups/` (gitignored). It reads the Turso credentials from
`.env.production.local`. BLOBs (uploaded documents) are base64-encoded so the
snapshot is a complete, restorable copy. Run it before any risky migration and
on a routine cadence (a cron/Vercel-cron hookup is a good next step).

---

## Conventions

- Client-facing copy is Dutch (warm, direct, geen jargon); facilitator UI is English.
- Scores are always percentage rings (border fills to the score) — never letter grades.
- Bands: 0–34% blinde vlek · 35–59% latent · 60–79% in opbouw · 80–100% koploper.
- Unknown numbers stay as `«token»` placeholders — filled later, never guessed.
- AI features fail soft: no API key → a setup note, never a crash.
