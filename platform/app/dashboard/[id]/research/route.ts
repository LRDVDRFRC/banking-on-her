import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db, ensureSchema } from "@/lib/db";
import { generateResearchBrief } from "@/lib/research-brief";

export const dynamic = "force-dynamic";
// Deep research is one long Claude call with server-side web search — a run
// routinely takes 2–3 minutes, so give the route the full five.
export const maxDuration = 300;

/**
 * POST /dashboard/[id]/research — run the deep-research brief for this sprint
 * and store the markdown in sprints.research_brief (+ research_brief_at).
 * Idempotent: re-running simply replaces the previous brief.
 */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  await ensureSchema();
  const c = db();

  const sprintRes = await c.execute({
    sql: "SELECT id, client, website, sector, region FROM sprints WHERE id = ?",
    args: [id],
  });
  if (sprintRes.rows.length === 0) {
    return NextResponse.json({ error: "Sprint not found." }, { status: 404 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Not configured: set the ANTHROPIC_API_KEY environment variable to enable deep research." },
      { status: 503 }
    );
  }

  const sprint = sprintRes.rows[0];
  try {
    const brief = await generateResearchBrief({
      client: String(sprint.client),
      website: sprint.website == null ? null : String(sprint.website),
      sectorKey: sprint.sector == null ? "pensioen" : String(sprint.sector),
      region: sprint.region == null ? "nl" : String(sprint.region),
    });

    await c.execute({
      sql: "UPDATE sprints SET research_brief = ?, research_brief_at = ? WHERE id = ?",
      args: [brief, new Date().toISOString(), id],
    });

    return NextResponse.json({ ok: true, chars: brief.length });
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
