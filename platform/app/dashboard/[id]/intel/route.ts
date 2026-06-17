import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { db, ensureSchema } from "@/lib/db";
import { generateResearchBrief } from "@/lib/research-brief";
import { harvestReports } from "@/lib/harvest-reports";
import { relevantRegions } from "@/lib/sectors";

export const dynamic = "force-dynamic";
// Two web-search-backed Claude calls (market+media brief, then report harvest).
// Each ~1–2 min; give the route the full five.
export const maxDuration = 300;

const reportId = (url: string) =>
  `res_${createHash("sha256").update(url).digest("hex").slice(0, 16)}`;

/**
 * POST /dashboard/[id]/intel — auto-collected on sprint creation (and re-runnable):
 *  1. market + media + competitors brief → sprints.research_brief
 *  2. recent finance+gender reports → research_reports library (deduped by URL)
 * Stamps sprints.intel_at. Idempotent.
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
      { error: "Not configured: set ANTHROPIC_API_KEY to enable intel collection." },
      { status: 503 }
    );
  }

  const s = sprintRes.rows[0];
  const client = String(s.client);
  const website = s.website == null ? null : String(s.website);
  const sectorKey = s.sector == null ? "pensioen" : String(s.sector);
  const region = s.region == null ? "nl" : String(s.region);

  try {
    // 1 · the market + media + competitors brief
    const brief = await generateResearchBrief({ client, website, sectorKey, region });
    await c.execute({
      sql: "UPDATE sprints SET research_brief = ?, research_brief_at = ? WHERE id = ?",
      args: [brief, new Date().toISOString(), id],
    });

    // 2 · harvest reports → the library (dedupe by URL-derived id; tag with this
    //     sprint's sector/region so they surface in findings + the library).
    const reports = await harvestReports({ client, sectorKey, region });
    const homeRegion = relevantRegions(region)[0] ?? region;
    let added = 0;
    for (const r of reports) {
      await c.execute({
        sql: `INSERT OR REPLACE INTO research_reports
              (id, title, organization, year, url, sector, region, topics, language, excerpt, key_stats, added_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          reportId(r.url), r.title, r.organization, r.year, r.url,
          sectorKey, homeRegion, r.topics.join(", "), r.language,
          r.excerpt, JSON.stringify(r.keyStats), new Date().toISOString(),
        ],
      });
      added++;
    }

    await c.execute({
      sql: "UPDATE sprints SET intel_at = ? WHERE id = ?",
      args: [new Date().toISOString(), id],
    });

    return NextResponse.json({ ok: true, briefChars: brief.length, reportsAdded: added });
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
