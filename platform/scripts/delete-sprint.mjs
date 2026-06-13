// Erasure: permanently delete one sprint and everything attached to it, across
// every table. Backs the GDPR right-to-erasure (Art. 17): run this to honour a
// deletion request or to purge a finished engagement.
//
//   node scripts/delete-sprint.mjs <sprintId>            # dry run (default)
//   node scripts/delete-sprint.mjs <sprintId> --apply    # actually delete
//
// Points at production when TURSO_DATABASE_URL is set (reads from the env or
// .env.production.local); otherwise the local file:local.db.
//
// Note on subprocessor copies: deleting here removes the data from OUR store
// (Turso) immediately. Copies that transited subprocessors age out on their own
// — Anthropic auto-deletes API inputs/outputs within 30 days; Vercel backups
// roll off within 30 days. Take a backup first if you might need to restore.

import { createClient } from "@libsql/client";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const sprintId = process.argv[2];
const apply = process.argv.includes("--apply");
if (!sprintId || sprintId.startsWith("--")) {
  console.error("Usage: node scripts/delete-sprint.mjs <sprintId> [--apply]");
  process.exit(1);
}

// Load Turso creds from .env.production.local if not already set. With neither,
// fall back to the local SQLite file.
if (!process.env.TURSO_DATABASE_URL) {
  const envPath = join(root, ".env.production.local");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

console.log(`Target DB: ${process.env.TURSO_DATABASE_URL ?? "file:local.db"}`);
console.log(`Sprint:    ${sprintId}`);
console.log(apply ? "Mode:      APPLY (will delete)\n" : "Mode:      dry run (no changes)\n");

const sprintRow = await db.execute({
  sql: "SELECT client FROM sprints WHERE id = ?",
  args: [sprintId],
});
if (sprintRow.rows.length === 0) {
  console.error(`No sprint with id "${sprintId}". Nothing to do.`);
  process.exit(1);
}
console.log(`Client: ${sprintRow.rows[0].client}\n`);

// Count what would go. assessments/scores are linked via participants/assessments.
const counts = {};
const countQueries = {
  participants: "SELECT count(*) AS n FROM participants WHERE sprint_id = ?",
  assessments: "SELECT count(*) AS n FROM assessments WHERE sprint_id = ?",
  scores:
    "SELECT count(*) AS n FROM scores WHERE assessment_id IN (SELECT id FROM assessments WHERE sprint_id = ?)",
  documents: "SELECT count(*) AS n FROM documents WHERE sprint_id = ?",
  concepts: "SELECT count(*) AS n FROM concepts WHERE sprint_id = ?",
  feedback: "SELECT count(*) AS n FROM feedback WHERE sprint_id = ?",
  sprints: "SELECT count(*) AS n FROM sprints WHERE id = ?",
};
for (const [table, sql] of Object.entries(countQueries)) {
  const r = await db.execute({ sql, args: [sprintId] });
  counts[table] = Number(r.rows[0].n);
  console.log(`  ${table}: ${counts[table]}`);
}

if (!apply) {
  console.log("\nDry run — nothing deleted. Re-run with --apply to erase.");
  process.exit(0);
}

// Delete children before parents. scores first (depends on assessments).
const deletes = [
  ["scores", "DELETE FROM scores WHERE assessment_id IN (SELECT id FROM assessments WHERE sprint_id = ?)"],
  ["assessments", "DELETE FROM assessments WHERE sprint_id = ?"],
  ["participants", "DELETE FROM participants WHERE sprint_id = ?"],
  ["documents", "DELETE FROM documents WHERE sprint_id = ?"],
  ["concepts", "DELETE FROM concepts WHERE sprint_id = ?"],
  ["feedback", "DELETE FROM feedback WHERE sprint_id = ?"],
  ["sprints", "DELETE FROM sprints WHERE id = ?"],
];
await db.batch(
  deletes.map(([, sql]) => ({ sql, args: [sprintId] })),
  "write"
);

console.log(`\n✓ Erased sprint ${sprintId} and all attached rows.`);
console.log("  Subprocessor copies (Anthropic, Vercel backups) age out within 30 days.");
