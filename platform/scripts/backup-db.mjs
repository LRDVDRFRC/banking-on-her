// Snapshot the PRODUCTION Turso database to a timestamped JSON file under
// backups/ (gitignored). Restorable: BLOBs (uploaded documents) are base64'd.
//
//   npm run backup
//
// Reads TURSO_DATABASE_URL + TURSO_AUTH_TOKEN from the environment, or from
// .env.production.local if not already set. Run before risky migrations and on
// a routine cadence.

import { createClient } from "@libsql/client";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

// Pull Turso creds from .env.production.local when not already in the env.
if (!process.env.TURSO_DATABASE_URL) {
  const envPath = join(root, ".env.production.local");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error(
    "Missing TURSO_DATABASE_URL / TURSO_AUTH_TOKEN. Set them in the environment\n" +
      "or in .env.production.local before running the backup."
  );
  process.exit(1);
}

const db = createClient({ url, authToken });

// libsql returns BLOB columns as ArrayBuffer/Uint8Array — JSON can't hold those,
// so wrap them in a self-describing marker the restore side can detect.
function encodeValue(v) {
  if (v instanceof ArrayBuffer) {
    return { __blob_b64: Buffer.from(v).toString("base64") };
  }
  if (v && v.buffer instanceof ArrayBuffer && typeof v.byteLength === "number") {
    return { __blob_b64: Buffer.from(v).toString("base64") };
  }
  return v;
}

const tablesRes = await db.execute(
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
);
const tables = tablesRes.rows.map((r) => String(r.name));

const snapshot = { takenAt: new Date().toISOString(), database: url, tables: {} };
let totalRows = 0;

for (const table of tables) {
  const res = await db.execute(`SELECT * FROM ${table}`);
  const rows = res.rows.map((row) => {
    const obj = {};
    for (const col of res.columns) obj[col] = encodeValue(row[col]);
    return obj;
  });
  snapshot.tables[table] = rows;
  totalRows += rows.length;
  console.log(`  ${table}: ${rows.length} rows`);
}

const backupsDir = join(root, "backups");
mkdirSync(backupsDir, { recursive: true });
// Filename-safe ISO timestamp, e.g. 2026-06-12T0942.
const stamp = new Date().toISOString().replace(/:/g, "").replace(/\..+/, "").replace("T", "T");
const outPath = join(backupsDir, `ifc-sprint-${stamp}.json`);
writeFileSync(outPath, JSON.stringify(snapshot, null, 2));

console.log(`\n✓ Backed up ${tables.length} tables, ${totalRows} rows`);
console.log(`  → ${outPath}`);
