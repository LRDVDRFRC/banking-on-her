import { createClient, type Client } from "@libsql/client";

let client: Client | undefined;
let schemaReady: Promise<void> | undefined;

export function db(): Client {
  client ??= createClient({
    url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return client;
}

const TABLES = [
  `CREATE TABLE IF NOT EXISTS sprints (
    id TEXT PRIMARY KEY,
    client TEXT NOT NULL,
    sprint_date TEXT,
    token TEXT UNIQUE NOT NULL,
    created_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY,
    sprint_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT,
    prework TEXT,
    created_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS assessments (
    id TEXT PRIMARY KEY,
    sprint_id TEXT NOT NULL,
    participant_id TEXT NOT NULL,
    answers_json TEXT NOT NULL,
    created_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS scores (
    assessment_id TEXT PRIMARY KEY,
    mens_organisatie INTEGER,
    data INTEGER,
    marketing_communicatie INTEGER,
    ecosystemen INTEGER,
    proposities INTEGER,
    overall INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS research_reports (
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
  )`,
  // Phase 4 ideation: one row per concept on the moment × mechanism grid.
  // source: 'room' | 'ai'. chosen: 0/1 — the 3–5 concepts that get built.
  // prototype_json: {valueprop, screen_html, test_script:{intro, tasks: string[],
  // questions: string[]}} — generated in Phase 5.
  `CREATE TABLE IF NOT EXISTS concepts (
    id TEXT PRIMARY KEY,
    sprint_id TEXT NOT NULL,
    title TEXT NOT NULL,
    moment TEXT NOT NULL,
    mechanism TEXT NOT NULL,
    description TEXT,
    source TEXT,
    chosen INTEGER DEFAULT 0,
    prototype_json TEXT,
    prototype_at TEXT,
    created_at TEXT
  )`,
  // Phase 6 evening panel: one row per panelist × concept.
  // scores_json: {gebruiken: 1-5, begrijpen: 1-5, vertrouwen: 1-5}
  `CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    sprint_id TEXT NOT NULL,
    concept_id TEXT NOT NULL,
    panelist TEXT NOT NULL,
    scores_json TEXT,
    quotes TEXT,
    observations TEXT,
    created_at TEXT
  )`,
  // Data-room uploads: original file + extracted text analysis.
  // status: 'analyzed' | 'pending_ai' (no API key at upload time) | 'extract_failed'
  `CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    sprint_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    mime TEXT,
    size_bytes INTEGER,
    uploaded_by TEXT,
    extracted_chars INTEGER,
    excerpt TEXT,
    key_stats TEXT,
    relevance TEXT,
    status TEXT,
    content BLOB,
    created_at TEXT
  )`,
];

// Additive migrations for databases created before these columns existed.
// libsql/SQLite has no "ADD COLUMN IF NOT EXISTS" — the duplicate-column
// error is swallowed so the migration stays idempotent.
const MIGRATIONS = [
  `ALTER TABLE sprints ADD COLUMN sector TEXT DEFAULT 'pensioen'`,
  `ALTER TABLE sprints ADD COLUMN region TEXT DEFAULT 'nl'`,
  // JSON array of short stat strings, e.g. ["40% lager pensioen (NL)", "€400/maand verschil"].
  `ALTER TABLE research_reports ADD COLUMN key_stats TEXT`,
  // Client website, used by the deep-research brief.
  `ALTER TABLE sprints ADD COLUMN website TEXT`,
  // Markdown brief produced by the deep-research run (+ when it ran).
  `ALTER TABLE sprints ADD COLUMN research_brief TEXT`,
  `ALTER TABLE sprints ADD COLUMN research_brief_at TEXT`,
  // AI intake interview per participant. JSON:
  // {completedAt, summary (EN), highlights: string[] (Dutch verbatim quotes),
  //  transcript: [{role: 'ai'|'user', text}]}
  `ALTER TABLE participants ADD COLUMN interview_json TEXT`,
  // AI-composed Dutch pre-read (the T–1 teaser sent to the client crew). JSON:
  // {intro, reflectie, teasers: [{kop, zin}], avond, afsluiting}
  `ALTER TABLE sprints ADD COLUMN preread_json TEXT`,
  `ALTER TABLE sprints ADD COLUMN preread_at TEXT`,
  // Morning-after readout, synthesized from the feedback table. JSON contract
  // in lib/readout.ts.
  `ALTER TABLE sprints ADD COLUMN readout_json TEXT`,
  `ALTER TABLE sprints ADD COLUMN readout_at TEXT`,
  // When auto-intel last ran for this sprint (brief + media + harvested reports).
  `ALTER TABLE sprints ADD COLUMN intel_at TEXT`,
];

/** Idempotent: creates the tables if missing and applies column migrations. */
export function ensureSchema(): Promise<void> {
  schemaReady ??= (async () => {
    const c = db();
    for (const sql of TABLES) await c.execute(sql);
    for (const sql of MIGRATIONS) {
      try {
        await c.execute(sql);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!/duplicate column/i.test(msg)) throw err;
      }
    }
  })();
  return schemaReady;
}
