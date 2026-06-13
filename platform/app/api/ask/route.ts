import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { searchReports, toMarkdownDigest } from "@/lib/library";
import { SECTORS, REGIONS } from "@/lib/sectors";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are the research assistant of Unlockt, a consultancy that helps financial institutions serve women clients better ("gender lens finance" — always the commercial business case, never the moral case, no DEI jargon).

You answer questions grounded EXCLUSIVELY in the research library digest provided below. Rules:
- Cite every claim inline as (Organization, Year). Never invent reports, numbers, or findings.
- Lead with the most decision-relevant numbers; keep answers tight and consultancy-sharp.
- Answer in the language of the question (Dutch question → Dutch answer).
- If the library does not cover the question, say so plainly and name what kind of report would need to be added — do not fall back on general knowledge for factual claims.
- When useful, end with one sentence on what the evidence means for a financial institution serving women clients.`;

// GET → feature availability (the UI uses this to render setup hints)
export async function GET() {
  return NextResponse.json({ enabled: Boolean(process.env.ANTHROPIC_API_KEY) });
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Not configured: set the ANTHROPIC_API_KEY environment variable to enable Ask the library." },
      { status: 503 }
    );
  }

  let body: { question?: string; sector?: string; region?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const question = (body.question ?? "").trim();
  if (!question || question.length > 2000) {
    return NextResponse.json({ error: "Provide a question (max 2000 characters)." }, { status: 400 });
  }
  const sector = body.sector && body.sector in SECTORS ? body.sector : undefined;
  const region = body.region && body.region in REGIONS ? body.region : undefined;

  const reports = await searchReports({ sector, region });
  if (reports.length === 0) {
    return NextResponse.json({
      answer: "The library has no reports matching those filters yet — widen the filters or add reports on /research.",
      reportsUsed: 0,
    });
  }

  // Stable digest timestamp = newest report's addedAt, so the cached system
  // block only changes when the library itself changes.
  const newest = reports.reduce<string | null>(
    (acc, r) => (r.addedAt && (!acc || r.addedAt > acc) ? r.addedAt : acc),
    null
  );
  const digest = toMarkdownDigest(reports, newest ? new Date(newest) : new Date(0));

  const client = new Anthropic();
  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      system: [
        { type: "text", text: SYSTEM_PROMPT },
        { type: "text", text: digest, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: question }],
    });

    const answer = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return NextResponse.json({ answer, reportsUsed: reports.length });
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
