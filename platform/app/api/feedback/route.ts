import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

// Phase 6 evening panel capture. The sprint token IS the auth (same model as
// /s/[token]/* and /api/upload) — no basic auth here, keep it out of the
// middleware matcher. Client-facing errors are Dutch: the panel host uses
// this live, between two panelists.

const SCORE_KEYS = ["gebruiken", "begrijpen", "vertrouwen"] as const;

async function sprintIdForToken(token: string): Promise<string | null> {
  if (!token) return null;
  const res = await db().execute({
    sql: "SELECT id FROM sprints WHERE token = ?",
    args: [token],
  });
  return res.rows.length === 0 ? null : String(res.rows[0].id);
}

/**
 * POST /api/feedback — store one panelist × concept reaction.
 * Body: {token, conceptId, panelist, scores: {gebruiken, begrijpen, vertrouwen}, quotes, observations}
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Ongeldige aanvraag — probeer het opnieuw." },
      { status: 400 }
    );
  }

  await ensureSchema();

  const token = String(body.token ?? "").trim();
  const sprintId = await sprintIdForToken(token);
  if (!sprintId) {
    return NextResponse.json(
      { error: "Deze sprintlink is niet (meer) geldig." },
      { status: 404 }
    );
  }

  const conceptId = String(body.conceptId ?? "").trim();
  const conceptRes = await db().execute({
    sql: "SELECT id FROM concepts WHERE id = ? AND sprint_id = ?",
    args: [conceptId, sprintId],
  });
  if (conceptRes.rows.length === 0) {
    return NextResponse.json(
      { error: "Dit concept hoort niet bij deze sprint." },
      { status: 404 }
    );
  }

  const panelist = String(body.panelist ?? "").trim();
  if (!panelist) {
    return NextResponse.json(
      { error: "Vul in welke panelist dit is (bijv. P1)." },
      { status: 400 }
    );
  }

  const rawScores = (body.scores ?? {}) as Record<string, unknown>;
  const scores: Record<string, number> = {};
  for (const key of SCORE_KEYS) {
    const v = rawScores[key];
    if (typeof v !== "number" || !Number.isInteger(v) || v < 1 || v > 5) {
      return NextResponse.json(
        { error: "Geef alle drie de scores een waarde van 1 tot 5." },
        { status: 400 }
      );
    }
    scores[key] = v;
  }

  const quotes = String(body.quotes ?? "").trim() || null;
  const observations = String(body.observations ?? "").trim() || null;

  const id = `fb_${randomBytes(6).toString("hex")}`;
  await db().execute({
    sql: `INSERT INTO feedback (id, sprint_id, concept_id, panelist, scores_json, quotes, observations, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      sprintId,
      conceptId,
      panelist,
      JSON.stringify(scores),
      quotes,
      observations,
      new Date().toISOString(),
    ],
  });

  return NextResponse.json({ ok: true, id });
}

/**
 * GET /api/feedback?token=…&conceptId=… → {count} — the little
 * "N reacties vastgelegd" widget on the capture form.
 */
export async function GET(req: NextRequest) {
  await ensureSchema();

  const token = (req.nextUrl.searchParams.get("token") ?? "").trim();
  const sprintId = await sprintIdForToken(token);
  if (!sprintId) {
    return NextResponse.json(
      { error: "Deze sprintlink is niet (meer) geldig." },
      { status: 404 }
    );
  }

  const conceptId = (req.nextUrl.searchParams.get("conceptId") ?? "").trim();
  const res = await db().execute({
    sql: "SELECT count(*) AS n FROM feedback WHERE sprint_id = ? AND concept_id = ?",
    args: [sprintId, conceptId],
  });
  return NextResponse.json({ count: Number(res.rows[0].n) });
}
