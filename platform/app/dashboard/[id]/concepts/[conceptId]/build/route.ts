import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db, ensureSchema } from "@/lib/db";
import { generatePrototype } from "@/lib/prototype";
import { DIMENSIONS, mergePcts, type DimensionKey } from "@/lib/scoring";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Up to `max` Dutch verbatim quotes across all intake interviews. */
function collectHighlights(rows: { interview_json: unknown }[], max: number): string[] {
  const quotes: string[] = [];
  for (const r of rows) {
    if (r.interview_json == null) continue;
    try {
      const p = JSON.parse(String(r.interview_json)) as { highlights?: unknown };
      if (Array.isArray(p.highlights)) {
        for (const h of p.highlights) {
          if (typeof h === "string" && h.trim() !== "") quotes.push(h.trim());
          if (quotes.length >= max) return quotes;
        }
      }
    } catch {
      // tolerate malformed interview JSON — skip the participant
    }
  }
  return quotes;
}

/**
 * POST /dashboard/[id]/concepts/[conceptId]/build — Phase 5: generate the
 * testable package (valueprop + phone mock + test script) for one concept and
 * store it in concepts.prototype_json. Idempotent; re-running overwrites.
 */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string; conceptId: string }> }
) {
  const { id, conceptId } = await ctx.params;
  await ensureSchema();
  const c = db();

  const sprintRes = await c.execute({
    sql: "SELECT id, client, sector, research_brief FROM sprints WHERE id = ?",
    args: [id],
  });
  if (sprintRes.rows.length === 0) {
    return NextResponse.json({ error: "Sprint not found." }, { status: 404 });
  }
  const sprint = sprintRes.rows[0];

  const conceptRes = await c.execute({
    sql: `SELECT id, title, moment, mechanism, description
          FROM concepts WHERE id = ? AND sprint_id = ?`,
    args: [conceptId, id],
  });
  if (conceptRes.rows.length === 0) {
    return NextResponse.json({ error: "Concept not found." }, { status: 404 });
  }
  const concept = conceptRes.rows[0];

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Not configured: set ANTHROPIC_API_KEY to enable the prototype builder." },
      { status: 503 }
    );
  }

  // ---- findings context (same queries as the findings page) ---------------

  // Lowest two dimensions from the merged readiness scores.
  const scoresRes = await c.execute({
    sql: `SELECT s.mens_organisatie, s.data, s.marketing_communicatie, s.ecosystemen, s.proposities
          FROM participants p
          JOIN assessments a ON a.participant_id = p.id
          JOIN scores s ON s.assessment_id = a.id
          WHERE p.sprint_id = ?`,
    args: [id],
  });
  let lowestDims: string[] = [];
  if (scoresRes.rows.length > 0) {
    const merged = Object.fromEntries(
      DIMENSIONS.map((d) => [d.key, mergePcts(scoresRes.rows.map((r) => Number(r[d.key])))])
    ) as Record<DimensionKey, number>;
    lowestDims = [...DIMENSIONS]
      .sort((a, b) => merged[a.key] - merged[b.key])
      .slice(0, 2)
      .map((d) => d.label);
  }

  // The hooks section of the deep-research brief, verbatim (English).
  const brief = sprint.research_brief == null ? null : String(sprint.research_brief);
  let hooks: string | null = null;
  if (brief) {
    const m = brief.match(/## Hooks for the sprint\n([\s\S]*?)(\n## |$)/);
    hooks = m ? m[1].trim() : null;
  }

  // Up to 5 verbatim interview quotes.
  const interviewRes = await c.execute({
    sql: `SELECT interview_json FROM participants
          WHERE sprint_id = ? AND interview_json IS NOT NULL
          ORDER BY created_at ASC`,
    args: [id],
  });
  const quotes = collectHighlights(
    interviewRes.rows.map((r) => ({ interview_json: r.interview_json })),
    5
  );

  try {
    const prototype = await generatePrototype({
      client: String(sprint.client),
      sectorKey: sprint.sector == null ? "pensioen" : String(sprint.sector),
      concept: {
        title: String(concept.title),
        moment: String(concept.moment),
        mechanism: String(concept.mechanism),
        description: concept.description == null ? null : String(concept.description),
      },
      findingsContext: { lowestDims, hooks, quotes },
    });

    await c.execute({
      sql: "UPDATE concepts SET prototype_json = ?, prototype_at = ? WHERE id = ? AND sprint_id = ?",
      args: [JSON.stringify(prototype), new Date().toISOString(), conceptId, id],
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Claude API error (${error.status}).` },
        { status: 502 }
      );
    }
    if (error instanceof SyntaxError || error instanceof Error) {
      // Malformed/incomplete generation — surface it so the facilitator can retry.
      return NextResponse.json(
        { error: `Prototype generation failed: ${error.message}` },
        { status: 502 }
      );
    }
    throw error;
  }
}
