"use server";

import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { db, ensureSchema } from "@/lib/db";
import {
  DEFAULT_REGION,
  DEFAULT_SECTOR,
  isRegionKey,
  isSectorKey,
} from "@/lib/sectors";
import {
  DIMENSIONS,
  dimensionPct,
  overallPct,
  type DimensionKey,
} from "@/lib/scoring";

function rid(prefix: string): string {
  return `${prefix}_${randomBytes(6).toString("hex")}`;
}

/** Facilitator: create a sprint with a URL-safe random client token. */
export async function createSprint(formData: FormData) {
  const client = String(formData.get("client") ?? "").trim();
  const sprintDate = String(formData.get("sprint_date") ?? "").trim();
  const rawSector = String(formData.get("sector") ?? "").trim();
  const rawRegion = String(formData.get("region") ?? "").trim();
  const rawWebsite = String(formData.get("website") ?? "").trim();
  const sector = isSectorKey(rawSector) ? rawSector : DEFAULT_SECTOR;
  const region = isRegionKey(rawRegion) ? rawRegion : DEFAULT_REGION;
  // Loose validation: the deep-research brief just needs a fetchable URL,
  // so anything that doesn't start with http(s) is silently dropped.
  const website = /^https?:\/\//i.test(rawWebsite) ? rawWebsite : null;
  if (!client) redirect("/");

  await ensureSchema();
  const id = rid("spr");
  const token = randomBytes(8).toString("base64url");
  await db().execute({
    sql: "INSERT INTO sprints (id, client, sprint_date, token, sector, region, website, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    args: [id, client, sprintDate || null, token, sector, region, website, new Date().toISOString()],
  });
  redirect(`/dashboard/${id}`);
}

/**
 * Deterministic research-report id derived from the url, so manual adds and
 * scripts/import-research.mjs upsert the same row for the same source.
 */
function researchId(url: string): string {
  return `res_${createHash("sha256").update(url).digest("hex").slice(0, 16)}`;
}

/** Facilitator: add (or update, keyed by url) a report in the research library. */
export async function addResearchReport(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const organization = String(formData.get("organization") ?? "").trim();
  const yearRaw = String(formData.get("year") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const rawSector = String(formData.get("sector") ?? "").trim();
  const rawRegion = String(formData.get("region") ?? "").trim();
  const topics = String(formData.get("topics") ?? "").trim();
  const language = String(formData.get("language") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const keyStatsRaw = String(formData.get("key_stats") ?? "");

  if (!title || !url || !excerpt) redirect("/research");
  const year = /^\d{4}$/.test(yearRaw) ? Number(yearRaw) : null;
  const sector = isSectorKey(rawSector) ? rawSector : "algemeen";
  const region = isRegionKey(rawRegion) ? rawRegion : DEFAULT_REGION;
  const cleanTopics = topics
    ? topics.split(",").map((t) => t.trim()).filter(Boolean).join(", ")
    : null;
  // One stat per textarea line → JSON array; NULL when the field is empty.
  const keyStats = keyStatsRaw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  await ensureSchema();
  await db().execute({
    sql: `INSERT OR REPLACE INTO research_reports
          (id, title, organization, year, url, sector, region, topics, language, excerpt, key_stats, added_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      researchId(url),
      title,
      organization || null,
      year,
      url,
      sector,
      region,
      cleanTopics,
      language || null,
      excerpt,
      keyStats.length > 0 ? JSON.stringify(keyStats) : null,
      new Date().toISOString(),
    ],
  });
  redirect("/research");
}

/** Client intake: register a participant, then continue to the self-assessment. */
export async function registerParticipant(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const prework = String(formData.get("prework") ?? "").trim();

  await ensureSchema();
  const sprintRes = await db().execute({
    sql: "SELECT id FROM sprints WHERE token = ?",
    args: [token],
  });
  if (sprintRes.rows.length === 0) redirect("/");
  if (!name) redirect(`/s/${token}/intake`);

  const sprintId = String(sprintRes.rows[0].id);
  const id = rid("par");
  await db().execute({
    sql: "INSERT INTO participants (id, sprint_id, name, role, prework, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: [id, sprintId, name, role || null, prework || null, new Date().toISOString()],
  });
  redirect(`/s/${token}/assessment?p=${id}`);
}

/**
 * Client: store the 29 answers in EXACTLY the offline self-assessment schema
 * plus a computed scores row, then return to the assessment page (which now
 * shows the participant's own rings).
 *
 * Upsert semantics: a participant who resubmits (the "Pas je antwoorden aan"
 * edit flow) REPLACES their earlier assessment + scores — never a duplicate.
 * The payload date is the (re)submission date.
 */
export async function submitAssessment(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  const participantId = String(formData.get("participant") ?? "").trim();

  await ensureSchema();
  const c = db();

  const sprintRes = await c.execute({
    sql: "SELECT id FROM sprints WHERE token = ?",
    args: [token],
  });
  if (sprintRes.rows.length === 0) redirect("/");
  const sprintId = String(sprintRes.rows[0].id);

  const partRes = await c.execute({
    sql: "SELECT id, name FROM participants WHERE id = ? AND sprint_id = ?",
    args: [participantId, sprintId],
  });
  if (partRes.rows.length === 0) redirect(`/s/${token}/intake`);
  const respondent = String(partRes.rows[0].name);

  // Collect and validate all 29 answers (0–4 integers).
  const answers = {} as Record<DimensionKey, number[]>;
  for (const dim of DIMENSIONS) {
    const arr: number[] = [];
    for (let i = 0; i < dim.questions.length; i++) {
      const raw = formData.get(`q__${dim.key}__${i}`);
      const v = raw === null ? NaN : Number(raw);
      if (!Number.isInteger(v) || v < 0 || v > 4) {
        redirect(`/s/${token}/assessment?p=${participantId}&error=incomplete`);
      }
      arr.push(v);
    }
    answers[dim.key] = arr;
  }

  // Exact offline export schema (key order matters for byte-for-byte parity).
  const payload = {
    version: 1,
    tool: "unlockt-self-assessment",
    respondent,
    date: new Date().toISOString().slice(0, 10),
    answers,
  };

  const pcts = DIMENSIONS.map((dim) => dimensionPct(answers[dim.key]));
  const overall = overallPct(pcts);

  // Replace-then-insert in ONE batch (libsql batches run as a transaction):
  // idempotent, and a participant can never end up with two assessment rows.
  const assessmentId = rid("asm");
  await c.batch(
    [
      {
        sql: "DELETE FROM scores WHERE assessment_id IN (SELECT id FROM assessments WHERE participant_id = ?)",
        args: [participantId],
      },
      {
        sql: "DELETE FROM assessments WHERE participant_id = ?",
        args: [participantId],
      },
      {
        sql: "INSERT INTO assessments (id, sprint_id, participant_id, answers_json, created_at) VALUES (?, ?, ?, ?, ?)",
        args: [assessmentId, sprintId, participantId, JSON.stringify(payload), new Date().toISOString()],
      },
      {
        sql: `INSERT INTO scores (assessment_id, mens_organisatie, data, marketing_communicatie, ecosystemen, proposities, overall)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [assessmentId, pcts[0], pcts[1], pcts[2], pcts[3], pcts[4], overall],
      },
    ],
    "write"
  );

  redirect(`/s/${token}/assessment?p=${participantId}`);
}
