// Harvest recent, real, relevant finance + gender reports from the public web
// and return them structured for the research_reports library. Web-search-backed
// Claude call; the route upserts the results (deduped by URL).

import Anthropic from "@anthropic-ai/sdk";
import { regionLabel, sectorLabel } from "@/lib/sectors";

export interface HarvestInput {
  client: string;
  sectorKey: string;
  region: string;
}

export interface HarvestedReport {
  title: string;
  organization: string | null;
  year: number | null;
  url: string;
  topics: string[];
  language: string | null;
  excerpt: string;
  keyStats: string[];
}

function systemPrompt({ client, sectorKey, region }: HarvestInput): string {
  return `You are a research librarian at Unlockt, which helps financial institutions serve women clients better (the commercial case, not the moral case). You are sourcing evidence for a sprint at ${client}, a ${sectorLabel(sectorKey)} in ${regionLabel(region)}.

Use web search to find 4 to 6 RECENT, REAL, and genuinely relevant reports, studies or data publications on FINANCE + GENDER that matter for this sector and region — e.g. the gender gap in this sector, women's financial behaviour and needs, the commercial opportunity of serving women clients, or a competitor/peer's published initiative or best practice. Prefer authoritative sources (regulators, central banks, statistics offices, academic/pension institutes, consultancies, industry bodies) and recent material.

HARD RULES:
- Every report MUST be a real document at a real, working URL you actually found via search. Never invent a title, organisation, number, or URL.
- Every number in an excerpt must come from that source. If you cannot verify, leave it out.
- No duplicates. Skip anything already obviously generic/irrelevant.

After researching, output ONLY a JSON array (no prose, no markdown fence) of objects with EXACTLY these keys:
[{"title": string, "organization": string|null, "year": number|null, "url": string, "topics": string[] (2-4 short tags), "language": "nl"|"en"|other, "excerpt": string (~90 words, what it is + its most decision-relevant finding, with verified numbers), "key_stats": string[] (1-3 short stat strings drawn only from the excerpt/source)}]

If you genuinely find fewer than 4 solid reports, return only the solid ones rather than padding.`;
}

function extractJsonArray(text: string): unknown {
  // Prefer a fenced block, else the first top-level [...] in the text.
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1] : text;
  const start = candidate.indexOf("[");
  const end = candidate.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return [];
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return [];
  }
}

function coerce(raw: unknown): HarvestedReport[] {
  if (!Array.isArray(raw)) return [];
  const out: HarvestedReport[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const title = typeof o.title === "string" ? o.title.trim() : "";
    const url = typeof o.url === "string" ? o.url.trim() : "";
    const excerpt = typeof o.excerpt === "string" ? o.excerpt.trim() : "";
    if (!title || !/^https?:\/\//.test(url) || !excerpt) continue;
    const yearNum = Number(o.year);
    out.push({
      title,
      organization: typeof o.organization === "string" && o.organization.trim() ? o.organization.trim() : null,
      year: Number.isFinite(yearNum) && yearNum > 1990 && yearNum < 2100 ? Math.trunc(yearNum) : null,
      url,
      topics: Array.isArray(o.topics) ? o.topics.filter((t): t is string => typeof t === "string").slice(0, 4) : [],
      language: typeof o.language === "string" ? o.language.trim().slice(0, 8) : null,
      excerpt,
      keyStats: Array.isArray(o.key_stats) ? o.key_stats.filter((t): t is string => typeof t === "string").slice(0, 3) : [],
    });
  }
  return out;
}

export async function harvestReports(input: HarvestInput): Promise<HarvestedReport[]> {
  const anthropic = new Anthropic();
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: "Find the reports now and output the JSON array." },
  ];
  const system = systemPrompt(input);

  // pause_turn = the server-side search loop hit its cap; resume. Bounded so a
  // pathological loop can't run forever, and kept well under the 300s function cap.
  const MAX_CONTINUATIONS = 2;
  let response: Anthropic.Message | null = null;
  for (let attempt = 0; attempt <= MAX_CONTINUATIONS; attempt++) {
    const stream = anthropic.messages.stream({
      model: "claude-opus-4-8",
      max_tokens: 4000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
      messages,
    });
    response = await stream.finalMessage();
    if (response.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: response.content });
  }
  if (!response) return [];

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  return coerce(extractJsonArray(text));
}
