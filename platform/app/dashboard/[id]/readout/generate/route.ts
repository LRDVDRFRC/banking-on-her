import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db, ensureSchema } from "@/lib/db";
import { generateReadout, type ReadoutConceptInput, type ReadoutFeedbackRow } from "@/lib/readout";

export const dynamic = "force-dynamic";
// One Claude call over all feedback rows — give it room.
export const maxDuration = 120;

/** prototype_json → the value-prop headline, leniently (Phase 5 shape may vary). */
function valuepropKop(raw: unknown): string | null {
  if (raw == null) return null;
  try {
    const p = JSON.parse(String(raw)) as Record<string, unknown>;
    const v = p.valueprop;
    if (typeof v === "string" && v.trim() !== "") return v.trim();
    if (v && typeof v === "object") {
      const kop = (v as Record<string, unknown>).kop;
      if (typeof kop === "string" && kop.trim() !== "") return kop.trim();
    }
    return null;
  } catch {
    return null;
  }
}

/** scores_json → validated {gebruiken, begrijpen, vertrouwen}, or null when malformed. */
function parseScores(raw: unknown): ReadoutFeedbackRow["scores"] | null {
  if (raw == null) return null;
  try {
    const p = JSON.parse(String(raw)) as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const key of ["gebruiken", "begrijpen", "vertrouwen"] as const) {
      const v = Number(p[key]);
      if (!Number.isFinite(v) || v < 1 || v > 5) return null;
      out[key] = v;
    }
    return out as ReadoutFeedbackRow["scores"];
  } catch {
    return null;
  }
}

/**
 * POST /dashboard/[id]/readout/generate — synthesize the morning readout from
 * the evening's feedback rows and store it in sprints.readout_json.
 * Idempotent: re-running replaces the previous readout.
 */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  await ensureSchema();
  const c = db();

  const sprintRes = await c.execute({
    sql: "SELECT id, client, sector FROM sprints WHERE id = ?",
    args: [id],
  });
  if (sprintRes.rows.length === 0) {
    return NextResponse.json({ error: "Sprint not found." }, { status: 404 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Not configured: set the ANTHROPIC_API_KEY environment variable to enable the readout synthesis." },
      { status: 503 }
    );
  }
  const sprint = sprintRes.rows[0];

  // The chosen (= built and tested) concepts, Phase 4/5.
  const conceptsRes = await c.execute({
    sql: `SELECT id, title, moment, mechanism, prototype_json
          FROM concepts WHERE sprint_id = ? AND chosen = 1
          ORDER BY created_at ASC`,
    args: [id],
  });
  if (conceptsRes.rows.length === 0) {
    return NextResponse.json(
      { error: "No chosen concepts yet — pick 3–5 concepts on the ideation canvas (Phase 4) and test them first." },
      { status: 409 }
    );
  }

  // All evening feedback, grouped per concept.
  const feedbackRes = await c.execute({
    sql: `SELECT concept_id, panelist, scores_json, quotes, observations
          FROM feedback WHERE sprint_id = ? ORDER BY created_at ASC`,
    args: [id],
  });
  const byConcept = new Map<string, ReadoutFeedbackRow[]>();
  for (const r of feedbackRes.rows) {
    const scores = parseScores(r.scores_json);
    if (!scores) continue; // skip malformed rows rather than poisoning the math
    const row: ReadoutFeedbackRow = {
      panelist: String(r.panelist),
      scores,
      quotes: r.quotes == null ? null : String(r.quotes),
      observations: r.observations == null ? null : String(r.observations),
    };
    const key = String(r.concept_id);
    const list = byConcept.get(key);
    if (list) list.push(row);
    else byConcept.set(key, [row]);
  }

  // Only concepts the panel actually reached enter the synthesis.
  const concepts: ReadoutConceptInput[] = conceptsRes.rows
    .map((r) => ({
      id: String(r.id),
      title: String(r.title),
      moment: String(r.moment),
      mechanism: String(r.mechanism),
      valuepropKop: valuepropKop(r.prototype_json),
      feedback: byConcept.get(String(r.id)) ?? [],
    }))
    .filter((c) => c.feedback.length > 0);

  if (concepts.length === 0) {
    return NextResponse.json(
      { error: "No panel feedback captured yet — the readout synthesizes the evening's reactions. Capture at least one reaction on the test stations (Phase 6) first." },
      { status: 409 }
    );
  }

  try {
    const doc = await generateReadout({
      client: String(sprint.client),
      sectorKey: sprint.sector == null ? "pensioen" : String(sprint.sector),
      concepts,
    });

    await c.execute({
      sql: "UPDATE sprints SET readout_json = ?, readout_at = ? WHERE id = ?",
      args: [JSON.stringify(doc), new Date().toISOString(), id],
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "The configured ANTHROPIC_API_KEY was rejected." }, { status: 503 });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "Rate limited — try again in a moment." }, { status: 429 });
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `Claude API error (${error.status}).` }, { status: 502 });
    }
    throw error;
  }
}
