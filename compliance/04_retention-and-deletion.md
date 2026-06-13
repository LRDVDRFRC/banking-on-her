# Retention & deletion

> Draft for review. See `README.md`.

## Principle

Sprint data is kept only as long as needed for the engagement and the agreed
follow-up, then erased. The platform has working **backup** and **erasure**
capabilities (below), so this policy describes real mechanisms, not intentions.

## Retention schedule (controller to set the exact periods)

| Data | Default retention | Trigger to delete |
|---|---|---|
| Sprint records (scores, concepts, prototypes, readout) | Engagement + **[12] months** for follow-up advisory | End of retention period, or on controller request |
| AI-interview transcripts & uploaded documents | Engagement + **[3] months** | End of period, or on request |
| Test-panel feedback (first name, age, quotes, scores) | **[3] months** after the sprint | End of period |
| Backups (our snapshots) | **[90] days**, rolling | Auto-expire |

These are starting defaults — the **controller decides** the periods in the DPA.

## How erasure actually works

1. **Our database (Turso, EU).** `npm run delete-sprint <sprintId> --apply`
   permanently deletes the sprint and every attached row (participants,
   assessments, scores, documents, concepts, feedback) across all tables. Run a
   dry-run first (omit `--apply`) to see exactly what will go.
2. **Our backups.** Snapshots are local JSON files (`npm run backup`); purge the
   relevant file(s) when honouring an erasure request, or let them roll off the
   90-day window.
3. **Sub-processor copies — age out automatically:**
   - **Anthropic:** API inputs/outputs auto-deleted within **30 days** (no
     action needed; not retrievable by us in the meantime).
   - **Vercel:** backups roll off within **30 days**.
   - **Turso:** deleting the data above removes it from the live database;
     deleting a database also deletes its backups.

So a data-subject erasure request is satisfied by: delete from our DB now →
purge the relevant backup → confirm sub-processor copies age out within 30 days.
**Maximum time to full erasure across all systems: 30 days** (bounded by the
Anthropic/Vercel windows), immediate in our own store.

## Data-subject requests

Forward any request received directly to the **controller** (it owns the
relationship and the legal basis). On the controller's instruction, action it
using the mechanisms above and confirm completion in writing.

## Caveat on `claude-opus-4-8`

The current AI model mandates a 30-day Anthropic-side retention and cannot run
zero-retention (see `01_…`). So "immediate and total erasure everywhere" is not
truthful while data is within that 30-day window — state the **30-day bound**
honestly. If a client requires faster guaranteed erasure at the AI layer, that
is part of the EU-residency / model decision in `09_open-items-and-decisions.md`.
