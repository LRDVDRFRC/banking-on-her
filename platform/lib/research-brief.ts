// Deep-research brief generator: one Claude call with server-side web search
// that produces the "Market & competitors" markdown brief for a sprint client.
// The findings page (app/dashboard/[id]/findings) parses the section headings,
// so the EXACT "## " headings in the system prompt are load-bearing.

import Anthropic from "@anthropic-ai/sdk";
import { regionLabel, sectorLabel } from "@/lib/sectors";

export interface ResearchBriefInput {
  /** Client name, e.g. "BeFrank". */
  client: string;
  /** Client website URL, if known. */
  website: string | null;
  /** Sector key from lib/sectors (falls back to pensioen label). */
  sectorKey: string;
  /** Region key from lib/sectors (falls back to NL label). */
  region: string;
}

/** The exact section headings the brief must contain (downstream pages parse these). */
export const BRIEF_SECTIONS = [
  "## Company snapshot",
  "## The inclusive-finance angle",
  "## In the media",
  "## Competitors & best practices",
  "## Hooks for the sprint",
  "## Sources",
] as const;

function systemPrompt({ client, website, sectorKey, region }: ResearchBriefInput): string {
  return `You are a senior strategy consultant at Unlockt, preparing a one-day "Gender Capital Lab" sprint at ${client} (${website ?? "no website provided"}), a ${sectorLabel(sectorKey)} in ${regionLabel(region)}. Unlockt helps financial institutions serve women clients better — always the commercial business case, never the moral case, no DEI jargon.

Research the public web and produce a MARKDOWN brief with EXACTLY these section headings, in this order (a downstream page parses them — do not rename, reorder, or add top-level sections):

## Company snapshot
Size, market positioning, client segments, recent strategic moves (acquisitions, product launches, leadership, regulation hitting them).

## The inclusive-finance angle
What they publicly say or do about women clients, the diversity of their client base, ESG/DEI signals — and, crucially, the gaps between what they claim and what they demonstrably do.

## In the media
What the press, trade media and notable voices have published RECENTLY about ${client} specifically in relation to women, gender, equality or inclusion — and the broader narrative being written about this company on those themes. For each notable item give the outlet, the date if findable, and one line on what it said. If coverage is thin or absent, say so plainly (that silence is itself a finding). Prefer recent items.

## Competitors & best practices
Direct competitors AND indirect or inspiration players: who serves women clients well anywhere in finance, and concretely WHAT they do (products, defaults, campaigns, data practices) — not vague praise.

## Hooks for the sprint
3–5 sharp, provocative, evidence-based openers we can use in the morning presentation to make the room sit up. Each hook one or two sentences, each anchored in a fact you found.

## Sources
A bulleted list of the URLs you actually used.

Tone: fact-based and commercial, no DEI fluff. Every factual claim should trace to a search result — if you could not verify something, say so rather than inventing it. Write the brief in English; quote Dutch source material verbatim in Dutch where the wording itself matters. Keep the whole brief under 1100 words — sharp beats exhaustive.`;
}

const USER_PROMPT =
  "Run the research now and write the full brief. Use the web search tool for every factual claim.";

/**
 * One web-search-backed Claude call → the markdown brief text.
 * Streams (server tool calls make this a multi-minute request) and resumes on
 * `pause_turn` so a long search loop still completes within one invocation.
 * Throws Anthropic.APIError subclasses on API failure — callers map to HTTP.
 */
export async function generateResearchBrief(input: ResearchBriefInput): Promise<string> {
  const anthropic = new Anthropic();

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: USER_PROMPT }];
  const system = systemPrompt(input);

  // pause_turn = the server-side search loop hit its iteration cap; re-send
  // the partial assistant turn and the API resumes. Bounded so a pathological
  // loop can't run forever. The whole run must stay safely under Vercel's
  // 300s function cap — hence medium effort and a tight search budget.
  const MAX_CONTINUATIONS = 2;
  let response: Anthropic.Message | null = null;

  for (let attempt = 0; attempt <= MAX_CONTINUATIONS; attempt++) {
    const stream = anthropic.messages.stream({
      model: "claude-opus-4-8",
      max_tokens: 6000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system,
      // Deliberately the previous-generation search tool: web_search_20260209
      // adds dynamic-filtering code-execution rounds that blow the run past
      // Vercel's 300s cap (measured 410s vs 50s for the same brief).
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
      messages,
    });
    response = await stream.finalMessage();

    if (response.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: response.content });
  }

  if (!response) throw new Error("Deep research produced no response.");

  // Final text = concatenated text blocks; thinking / tool-use / search-result
  // blocks are ignored.
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  if (!text) throw new Error("Deep research returned an empty brief.");
  return text;
}
