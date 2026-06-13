// GET /api/library — the machine door to the research library.
//
// Query params (all optional):
//   q        free-text search over title / organization / topics / excerpt
//   sector   exact sector key (pensioen, bank, verzekeraar, vermogensbeheer, hypotheek, algemeen)
//   region   exact region key (nl, eu, global)
//   topic    exact topic
//   language exact language code (nl, en, …)
//   format   "json" (default — full records, key_stats as arrays) or
//            "md" (text/markdown digest for an AI context window)
//
// Sector/region matching is EXACT here — the relevantRegions widening is a
// dashboard concern, not the API's. Auth is handled centrally in middleware.

import { searchReports, toMarkdownDigest } from "@/lib/library";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const reports = await searchReports({
    q: params.get("q") ?? undefined,
    sector: params.get("sector") ?? undefined,
    region: params.get("region") ?? undefined,
    topic: params.get("topic") ?? undefined,
    language: params.get("language") ?? undefined,
  });

  if (params.get("format") === "md") {
    return new Response(toMarkdownDigest(reports, new Date()), {
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }

  return Response.json({
    count: reports.length,
    reports: reports.map((r) => ({
      id: r.id,
      title: r.title,
      organization: r.organization,
      year: r.year,
      url: r.url,
      sector: r.sector,
      region: r.region,
      topics: r.topics,
      language: r.language,
      excerpt: r.excerpt,
      key_stats: r.keyStats,
      added_at: r.addedAt,
    })),
  });
}
