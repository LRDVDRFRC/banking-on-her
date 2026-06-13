#!/usr/bin/env node
// seed.mjs — wipe and re-create the schema, then insert two demo sprints:
// BeFrank (demo), token "demo", three diverging respondents — and Demo Bank,
// token "demo-bank", two respondents (so the cross-sprint benchmark has data).
// Local only: writes to file:local.db unless TURSO_DATABASE_URL is set.

import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// ---------------------------------------------------------------- scoring
// Mirrors lib/scoring.ts: pct = round(sum / (4·n) · 100); overall = round(mean of 5 pcts).
const DIMENSION_KEYS = [
  "mens_organisatie",
  "data",
  "marketing_communicatie",
  "ecosystemen",
  "proposities",
];

const dimensionPct = (arr) =>
  Math.round((arr.reduce((a, b) => a + b, 0) / (4 * arr.length)) * 100);
const overallPct = (pcts) =>
  Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);

// ---------------------------------------------------------------- demo data
const SPRINT = {
  id: "spr_demo",
  client: "BeFrank (demo)",
  sprint_date: "2026-06-26",
  token: "demo",
  sector: "pensioen",
  region: "nl",
};

// Second demo sprint in another sector, so the sector-adapted assessment
// wording (klanten / de bankapp instead of deelnemers / Mijn Pensioen) is
// visible side by side — and so the cross-sprint benchmark has a real
// portfolio baseline (each demo sprint is the other's n=1 baseline).
const BANK_SPRINT = {
  id: "spr_demo_bank",
  client: "Demo Bank",
  sprint_date: null,
  token: "demo-bank",
  sector: "bank",
  region: "nl",
};

// Three plausible, deliberately diverging answer sets (counts 6/6/6/5/6).
// The data lead rates Data high; marketing rates Marcom higher — spreads ≥ 25
// on Data and Marketing & communicatie so the dashboard flags them.
const PARTICIPANTS = [
  {
    id: "par_demo_1",
    name: "Maartje de Vries",
    role: "Productmanager",
    date: "2026-06-19",
    prework:
      "Vrouwen die parttime gaan werken zien pas decennia later wat dat kost. Wij hebben die data, maar doen er niets mee op het moment zelf. Daar laten we deelnemerswaarde én onderscheidend vermogen liggen.",
    answers: {
      mens_organisatie: [2, 1, 1, 2, 3, 2],
      data: [3, 2, 2, 1, 3, 2],
      marketing_communicatie: [1, 1, 2, 1, 0, 1],
      ecosystemen: [1, 0, 1, 1, 0],
      proposities: [1, 1, 2, 2, 1, 2],
    },
  },
  {
    id: "par_demo_2",
    name: "Jeroen Bakker",
    role: "Data & analytics lead",
    date: "2026-06-20",
    prework:
      "We kunnen de kloof per deelnemer berekenen, maar niemand vraagt erom. De data blijft in rapportages hangen in plaats van in de app terecht te komen. Eén nudge op het juiste moment zou direct vrijwillige bijstortingen opleveren.",
    answers: {
      mens_organisatie: [2, 1, 2, 3, 2, 1],
      data: [4, 3, 3, 2, 4, 3],
      marketing_communicatie: [0, 1, 1, 2, 0, 0],
      ecosystemen: [0, 1, 0, 1, 1],
      proposities: [1, 2, 1, 2, 0, 1],
    },
  },
  {
    id: "par_demo_3",
    name: "Sophie van Dam",
    role: "Marketing & communicatie",
    date: "2026-06-22",
    prework:
      "Onze communicatie gaat uit van een fulltime carrière die voor veel vrouwen niet bestaat. Rond ouderschapsverlof sturen we helemaal niets, terwijl dat hét moment is. Werkgevers zouden betalen voor een verhaal waarmee ze hun eigen kloof zichtbaar kunnen maken.",
    answers: {
      mens_organisatie: [3, 2, 2, 2, 3, 3],
      data: [1, 1, 2, 0, 1, 1],
      marketing_communicatie: [2, 3, 3, 2, 2, 1],
      ecosystemen: [1, 1, 1, 1, 1],
      proposities: [2, 2, 3, 2, 1, 2],
    },
  },
];

// Two diverging Demo Bank respondents (counts 6/6/6/5/6): the proposition
// lead sees a bank further along on marketing & proposities; the data
// scientist rates Data high and everything else low — a plausibly different
// profile from the pension sprint, so benchmark deltas are visible.
const BANK_PARTICIPANTS = [
  {
    id: "par_bank_1",
    name: "Anouk Visser",
    role: "Lead retail proposities",
    date: "2026-06-21",
    prework:
      "We bouwen spaar- en beleggingsfeatures voor 'de klant', maar onze vrouwelijke klanten sparen meer en beleggen minder. Niemand heeft ooit uitgerekend wat ons dat aan beheerd vermogen kost.",
    answers: {
      mens_organisatie: [3, 2, 2, 3, 3, 2],
      data: [2, 2, 1, 1, 2, 2],
      marketing_communicatie: [3, 2, 3, 2, 2, 2],
      ecosystemen: [2, 1, 2, 2, 1],
      proposities: [3, 2, 2, 3, 2, 2],
    },
  },
  {
    id: "par_bank_2",
    name: "Tim Janssen",
    role: "Data scientist",
    date: "2026-06-23",
    prework:
      "We kunnen vandaag per klant zien wie achterblijft in vermogensopbouw, uitgesplitst naar geslacht. Die dashboards bestaan al — er hangt alleen geen enkele actie of campagne aan.",
    answers: {
      mens_organisatie: [1, 1, 2, 2, 1, 1],
      data: [3, 4, 3, 2, 3, 3],
      marketing_communicatie: [1, 0, 1, 1, 0, 1],
      ecosystemen: [1, 0, 1, 1, 0],
      proposities: [1, 1, 2, 1, 1, 1],
    },
  },
];

// ---------------------------------------------------------------- schema
const TABLES = [
  `CREATE TABLE sprints (
    id TEXT PRIMARY KEY,
    client TEXT NOT NULL,
    sprint_date TEXT,
    token TEXT UNIQUE NOT NULL,
    sector TEXT DEFAULT 'pensioen',
    region TEXT DEFAULT 'nl',
    created_at TEXT
  )`,
  `CREATE TABLE participants (
    id TEXT PRIMARY KEY,
    sprint_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT,
    prework TEXT,
    created_at TEXT
  )`,
  `CREATE TABLE assessments (
    id TEXT PRIMARY KEY,
    sprint_id TEXT NOT NULL,
    participant_id TEXT NOT NULL,
    answers_json TEXT NOT NULL,
    created_at TEXT
  )`,
  `CREATE TABLE scores (
    assessment_id TEXT PRIMARY KEY,
    mens_organisatie INTEGER,
    data INTEGER,
    marketing_communicatie INTEGER,
    ecosystemen INTEGER,
    proposities INTEGER,
    overall INTEGER
  )`,
];

for (const table of ["scores", "assessments", "participants", "sprints"]) {
  await db.execute(`DROP TABLE IF EXISTS ${table}`);
}
for (const sql of TABLES) {
  await db.execute(sql);
}

// ---------------------------------------------------------------- insert
const now = new Date().toISOString();

for (const sprint of [SPRINT, BANK_SPRINT]) {
  await db.execute({
    sql: "INSERT INTO sprints (id, client, sprint_date, token, sector, region, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [sprint.id, sprint.client, sprint.sprint_date, sprint.token, sprint.sector, sprint.region, now],
  });
}

/** Insert one respondent (participant + assessment + scores) into a sprint. */
async function insertRespondent(sprintId, person, assessmentId) {
  await db.execute({
    sql: "INSERT INTO participants (id, sprint_id, name, role, prework, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: [person.id, sprintId, person.name, person.role, person.prework, now],
  });

  // Exact offline self-assessment schema (same key order as the form export).
  const payload = {
    version: 1,
    tool: "unlockt-self-assessment",
    respondent: person.name,
    date: person.date,
    answers: person.answers,
  };

  const pcts = DIMENSION_KEYS.map((key) => dimensionPct(person.answers[key]));
  const overall = overallPct(pcts);

  await db.execute({
    sql: "INSERT INTO assessments (id, sprint_id, participant_id, answers_json, created_at) VALUES (?, ?, ?, ?, ?)",
    args: [assessmentId, sprintId, person.id, JSON.stringify(payload), now],
  });
  await db.execute({
    sql: `INSERT INTO scores (assessment_id, mens_organisatie, data, marketing_communicatie, ecosystemen, proposities, overall)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [assessmentId, pcts[0], pcts[1], pcts[2], pcts[3], pcts[4], overall],
  });

  return `  - ${person.name} (${person.role}) — overall ${overall}%`;
}

const summary = [];
for (const [index, person] of PARTICIPANTS.entries()) {
  summary.push(await insertRespondent(SPRINT.id, person, `asm_demo_${index + 1}`));
}

const bankSummary = [];
for (const [index, person] of BANK_PARTICIPANTS.entries()) {
  bankSummary.push(await insertRespondent(BANK_SPRINT.id, person, `asm_bank_${index + 1}`));
}

db.close();

const target = process.env.TURSO_DATABASE_URL ?? "file:local.db";
console.log(`Seeded two demo sprints into ${target}`);
console.log("");
console.log(`Sprint: ${SPRINT.client} — ${SPRINT.sprint_date} (id ${SPRINT.id}, token ${SPRINT.token}, ${SPRINT.sector}/${SPRINT.region})`);
console.log("Respondents:");
for (const line of summary) console.log(line);
console.log("");
console.log(`Sprint: ${BANK_SPRINT.client} (id ${BANK_SPRINT.id}, token ${BANK_SPRINT.token}, ${BANK_SPRINT.sector}/${BANK_SPRINT.region})`);
console.log("Respondents:");
for (const line of bankSummary) console.log(line);
console.log("");
console.log("Each sprint doubles as the other's portfolio-benchmark baseline (n=1).");
console.log("");
console.log("Visit (npm run dev, default port 3000):");
console.log("  http://localhost:3000/                                    facilitator home");
console.log("  http://localhost:3000/s/demo/intake                       client intake (Dutch, pensioen)");
console.log("  http://localhost:3000/s/demo/assessment?p=par_demo_1      participant result view");
console.log("  http://localhost:3000/s/demo-bank/intake                  client intake (Dutch, bank wording)");
console.log("  http://localhost:3000/s/demo-bank/assessment?p=par_bank_1 participant result view (bank)");
console.log("  http://localhost:3000/dashboard/spr_demo                  facilitator dashboard");
console.log("  http://localhost:3000/dashboard/spr_demo/export           sprint-data JSON export");
console.log("  http://localhost:3000/dashboard/spr_demo_bank             Demo Bank dashboard");
console.log("  http://localhost:3000/research                            research library");
