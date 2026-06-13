import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db, ensureSchema } from "@/lib/db";
import { generatePreread } from "@/lib/preread";
import { formatDutchDate } from "@/lib/dates";
import { DIMENSIONS, mergePcts, overallPct, bandFor, type DimensionKey } from "@/lib/scoring";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /dashboard/[id]/preread — compose the Dutch T–1 pre-read from the
 * sprint's own data and store it in sprints.preread_json. Idempotent.
 */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  await ensureSchema();
  const c = db();

  const sprintRes = await c.execute({
    sql: "SELECT id, client, sprint_date, sector, research_brief FROM sprints WHERE id = ?",
    args: [id],
  });
  if (sprintRes.rows.length === 0) {
    return NextResponse.json({ error: "Sprint not found." }, { status: 404 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Not configured: set ANTHROPIC_API_KEY to enable pre-read composition." },
      { status: 503 }
    );
  }
  const sprint = sprintRes.rows[0];

  // Merged readiness (same math as dashboard/findings).
  const scoresRes = await c.execute({
    sql: `SELECT s.mens_organisatie, s.data, s.marketing_communicatie, s.ecosystemen, s.proposities
          FROM participants p
          JOIN assessments a ON a.participant_id = p.id
          JOIN scores s ON s.assessment_id = a.id
          WHERE p.sprint_id = ?`,
    args: [id],
  });
  const scored = scoresRes.rows;
  let overall: number | null = null;
  let band: string | null = null;
  let lowestDims: string[] = [];
  if (scored.length > 0) {
    const merged = Object.fromEntries(
      DIMENSIONS.map((d) => [d.key, mergePcts(scored.map((r) => Number(r[d.key])))])
    ) as Record<DimensionKey, number>;
    overall = overallPct(DIMENSIONS.map((d) => merged[d.key]));
    band = bandFor(overall).label;
    lowestDims = [...DIMENSIONS]
      .sort((a, b) => merged[a.key] - merged[b.key])
      .slice(0, 2)
      .map((d) => d.label);
  }

  const countRes = await c.execute({
    sql: "SELECT count(*) AS n FROM participants WHERE sprint_id = ?",
    args: [id],
  });

  // The hooks section of the research brief, verbatim (English; the composer translates).
  const brief = sprint.research_brief == null ? null : String(sprint.research_brief);
  let hooksMarkdown: string | null = null;
  if (brief) {
    const m = brief.match(/## Hooks for the sprint\n([\s\S]*?)(\n## |$)/);
    hooksMarkdown = m ? m[1].trim() : null;
  }

  try {
    const doc = await generatePreread({
      client: String(sprint.client),
      sprintDate: formatDutchDate(sprint.sprint_date == null ? null : String(sprint.sprint_date)),
      sectorKey: sprint.sector == null ? "pensioen" : String(sprint.sector),
      overallPct: overall,
      band,
      lowestDims,
      hooksMarkdown,
      participantCount: Number(countRes.rows[0].n),
    });

    await c.execute({
      sql: "UPDATE sprints SET preread_json = ?, preread_at = ? WHERE id = ?",
      args: [JSON.stringify(doc), new Date().toISOString(), id],
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `Claude API error (${error.status}).` }, { status: 502 });
    }
    throw error;
  }
}
