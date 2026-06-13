#!/usr/bin/env node
// scripts/import-research.mjs — import research-seed.json into research_reports.
//
// Usage:
//   npm run import-research                 → reads <platform root>/research-seed.json
//   node scripts/import-research.mjs FILE   → reads FILE instead (testing)
//
// Same env convention as seed.mjs: file:local.db unless TURSO_DATABASE_URL is
// set. Upserts by url: the row id is derived deterministically from the url,
// so re-running the import (or the same url added by hand) replaces in place.

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";

const defaultPath = fileURLToPath(new URL("../research-seed.json", import.meta.url));
const seedPath = process.argv[2] ?? defaultPath;

let raw;
try {
  raw = await readFile(seedPath, "utf8");
} catch (err) {
  if (err && err.code === "ENOENT") {
    console.error(`No seed file found at ${seedPath}.`);
    console.error(
      "Place research-seed.json in the platform root (or pass a path as the first argument) and re-run."
    );
    process.exit(1);
  }
  throw err;
}

let reports;
try {
  reports = JSON.parse(raw);
} catch (err) {
  console.error(`Could not parse ${seedPath} as JSON: ${err.message}`);
  process.exit(1);
}
if (!Array.isArray(reports)) {
  console.error(`Expected ${seedPath} to contain a JSON array of reports.`);
  process.exit(1);
}

const SECTOR_KEYS = ["pensioen", "bank", "verzekeraar", "vermogensbeheer", "hypotheek", "algemeen"];
const REGION_KEYS = ["nl", "eu", "global"];

const db = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Mirrors lib/db.ts so the script also works on a fresh database.
await db.execute(`CREATE TABLE IF NOT EXISTS research_reports (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  organization TEXT,
  year INTEGER,
  url TEXT NOT NULL,
  sector TEXT NOT NULL,
  region TEXT NOT NULL,
  topics TEXT,
  language TEXT,
  excerpt TEXT NOT NULL,
  added_at TEXT
)`);

// Mirrors the lib/db.ts key_stats migration for databases created before the
// column existed (SQLite has no ADD COLUMN IF NOT EXISTS).
try {
  await db.execute("ALTER TABLE research_reports ADD COLUMN key_stats TEXT");
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  if (!/duplicate column/i.test(msg)) throw err;
}

const researchId = (url) =>
  `res_${createHash("sha256").update(url).digest("hex").slice(0, 16)}`;

let imported = 0;
let skipped = 0;
const now = new Date().toISOString();

for (const [i, r] of reports.entries()) {
  const title = typeof r.title === "string" ? r.title.trim() : "";
  const url = typeof r.url === "string" ? r.url.trim() : "";
  const excerpt = typeof r.excerpt === "string" ? r.excerpt.trim() : "";
  if (!title || !url || !excerpt) {
    console.warn(`Skipping entry ${i}: title, url and excerpt are required.`);
    skipped++;
    continue;
  }
  const sector = SECTOR_KEYS.includes(r.sector) ? r.sector : "algemeen";
  const region = REGION_KEYS.includes(r.region) ? r.region : "global";
  const year = Number.isInteger(r.year) ? r.year : null;
  const topics = Array.isArray(r.topics)
    ? r.topics.map((t) => String(t).trim()).filter(Boolean).join(", ")
    : null;
  const language = typeof r.language === "string" && r.language.trim() ? r.language.trim() : null;
  const organization =
    typeof r.organization === "string" && r.organization.trim() ? r.organization.trim() : null;
  // Optional: short stat strings, stored as a JSON array (column stays NULL when absent).
  const keyStats = Array.isArray(r.key_stats)
    ? r.key_stats.map((s) => String(s).trim()).filter(Boolean)
    : [];

  await db.execute({
    sql: `INSERT OR REPLACE INTO research_reports
          (id, title, organization, year, url, sector, region, topics, language, excerpt, key_stats, added_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      researchId(url),
      title,
      organization,
      year,
      url,
      sector,
      region,
      topics,
      language,
      excerpt,
      keyStats.length > 0 ? JSON.stringify(keyStats) : null,
      now,
    ],
  });
  imported++;
}

const countRes = await db.execute("SELECT COUNT(*) AS n FROM research_reports");
db.close();

const target = process.env.TURSO_DATABASE_URL ?? "file:local.db";
console.log(`Imported ${imported} report(s) from ${seedPath} into ${target}${skipped > 0 ? ` (${skipped} skipped)` : ""}.`);
console.log(`Library now holds ${Number(countRes.rows[0].n)} report(s) — see /research.`);
