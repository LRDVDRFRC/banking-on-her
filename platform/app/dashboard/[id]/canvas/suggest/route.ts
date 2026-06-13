import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { db, ensureSchema } from "@/lib/db";
import { MECHANISMS, momentsFor, isMechanismKey, isMomentKey } from "@/lib/moments";
import { sectorLabel, sectorVocab } from "@/lib/sectors";
import { DIMENSIONS, mergePcts, type DimensionKey } from "@/lib/scoring";

export const dynamic = "force-dynamic";
// One structured-output Claude call over the sprint's findings — give it room.
export const maxDuration = 120;

interface Seed {
  title: string;
  moment: string;
  mechanism: string;
  description: string;
}

/** Lenient highlights parse from participants.interview_json. */
function parseHighlights(raw: unknown): string[] {
  if (raw == null) return [];
  try {
    const p = JSON.parse(String(raw)) as { highlights?: unknown };
    if (!Array.isArray(p.highlights)) return [];
    return p.highlights
      .filter((h): h is string => typeof h === "string" && h.trim() !== "")
      .map((h) => h.trim());
  } catch {
    return [];
  }
}

/**
 * POST /dashboard/[id]/canvas/suggest — ask Claude for 6–8 concept seeds
 * spread across different cells of this sprint's moment × mechanism grid,
 * anchored in the sprint's own findings. Inserts them with source 'ai'.
 */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  await ensureSchema();
  const c = db();

  const sprintRes = await c.execute({
    sql: "SELECT id, client, sector, research_brief FROM sprints WHERE id = ?",
    args: [id],
  });
  if (sprintRes.rows.length === 0) {
    return NextResponse.json({ error: "Sprint not found." }, { status: 404 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Not configured: set the ANTHROPIC_API_KEY environment variable to enable AI suggestions." },
      { status: 503 }
    );
  }

  const sprint = sprintRes.rows[0];
  const client = String(sprint.client);
  const sector = sprint.sector == null ? "pensioen" : String(sprint.sector);
  const vocab = sectorVocab(sector);
  const moments = momentsFor(sector);

  // ---- findings context ---------------------------------------------------
  // 1) Two lowest readiness dimensions (same merge math as dashboard/findings).
  const scoresRes = await c.execute({
    sql: `SELECT s.mens_organisatie, s.data, s.marketing_communicatie, s.ecosystemen, s.proposities
          FROM participants p
          JOIN assessments a ON a.participant_id = p.id
          JOIN scores s ON s.assessment_id = a.id
          WHERE p.sprint_id = ?`,
    args: [id],
  });
  let lowestTwo: { label: string; pct: number }[] = [];
  if (scoresRes.rows.length > 0) {
    const merged = Object.fromEntries(
      DIMENSIONS.map((d) => [d.key, mergePcts(scoresRes.rows.map((r) => Number(r[d.key])))])
    ) as Record<DimensionKey, number>;
    lowestTwo = [...DIMENSIONS]
      .sort((a, b) => merged[a.key] - merged[b.key])
      .slice(0, 2)
      .map((d) => ({ label: d.label, pct: merged[d.key] }));
  }

  // 2) Up to 6 verbatim interview quotes from the crew.
  const interviewRes = await c.execute({
    sql: "SELECT interview_json FROM participants WHERE sprint_id = ? AND interview_json IS NOT NULL",
    args: [id],
  });
  const quotes = interviewRes.rows
    .flatMap((r) => parseHighlights(r.interview_json))
    .slice(0, 6);

  // 3) Up to 4 analyzed data-room excerpts.
  const docsRes = await c.execute({
    sql: `SELECT filename, excerpt FROM documents
          WHERE sprint_id = ? AND status = 'analyzed' AND excerpt IS NOT NULL
          ORDER BY created_at ASC LIMIT 4`,
    args: [id],
  });
  const docExcerpts = docsRes.rows.map((r) => ({
    filename: String(r.filename),
    excerpt: String(r.excerpt).slice(0, 600),
  }));

  // 4) The "## Hooks for the sprint" section of the deep-research brief.
  const brief = sprint.research_brief == null ? null : String(sprint.research_brief);
  const hooksMatch = brief?.match(/## Hooks for the sprint\n([\s\S]*?)(\n## |$)/);
  const hooks = hooksMatch ? hooksMatch[1].trim() : null;

  // 5) Existing concepts — so the model avoids duplicating the room's ideas.
  const existingRes = await c.execute({
    sql: "SELECT title, moment, mechanism, source FROM concepts WHERE sprint_id = ?",
    args: [id],
  });
  const existing = existingRes.rows.map((r) => ({
    title: String(r.title),
    moment: String(r.moment),
    mechanism: String(r.mechanism),
    source: r.source == null ? "room" : String(r.source),
  }));

  // ---- the call -----------------------------------------------------------
  const momentKeys = moments.map((m) => m.key);
  const mechanismKeys = MECHANISMS.map((m) => m.key);

  const SUGGEST_SCHEMA = {
    type: "object",
    properties: {
      concepts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            moment: { type: "string", enum: momentKeys },
            mechanism: { type: "string", enum: mechanismKeys },
            description: { type: "string" },
          },
          required: ["title", "moment", "mechanism", "description"],
          additionalProperties: false,
        },
      },
    },
    required: ["concepts"],
    additionalProperties: false,
  };

  const system = `You are the ideation engine of Unlockt's Gender Capital Lab Sprint at ${client}, a ${sectorLabel(sector)}. At 12:30 the room converges on 3–5 testable concepts on a moment × mechanism grid; tonight 6–8 women from the target group test the prototypes. Your job: seed the grid with 6–8 sharp concept ideas the room can react to.

Hard rules:
- Each concept occupies exactly one cell: a "moment" (life event, row) × a "mechanism" (intervention type, column). Use ONLY the provided keys.
- SPREAD: never place two concepts in the same cell, and use at least 5 distinct cells. Vary both the moments and the mechanisms across the set.
- Anchor every concept in the findings provided (lowest readiness dimensions, the crew's own words, the client's documents, the research hooks). Commercial business case only — never the moral case, no DEI jargon.
- "title": DUTCH, max 8 words, prikkelend — something the room wants to build this afternoon.
- "description": DUTCH, exactly 2 sentences — (1) wat het is, (2) waarom nu, geankerd in de bevindingen (noem waar mogelijk een concreet cijfer of citaat-thema).
- Use the sector's own vocabulary: klant = "${vocab.klant}", app = "${vocab.app}", product = "${vocab.product}", de kloof = "${vocab.kloof}".
- Do not duplicate existing concepts (listed below) — complement them, and prefer cells that are still empty.

Moment keys (rows): ${moments.map((m) => `${m.key} = "${m.label}"`).join(", ")}.
Mechanism keys (columns): ${MECHANISMS.map((m) => `${m.key} = "${m.label}"`).join(", ")}.`;

  const user = `Findings for ${client}:

Lowest readiness dimensions (where the biggest unlock sits):
${lowestTwo.length > 0 ? lowestTwo.map((d) => `- ${d.label}: ${d.pct}%`).join("\n") : "- (no assessments yet — lean on the other findings)"}

The crew's own words (verbatim intake quotes):
${quotes.length > 0 ? quotes.map((q) => `- "${q}"`).join("\n") : "- (none yet)"}

From the client's own documents:
${docExcerpts.length > 0 ? docExcerpts.map((d) => `- ${d.filename}: ${d.excerpt}`).join("\n") : "- (none yet)"}

Research hooks (from our market research, English):
${hooks ?? "(no research brief yet — use general evidence on the gender wealth/pension gap for this sector)"}

Concepts already on the canvas (do not duplicate):
${existing.length > 0 ? existing.map((e) => `- [${e.moment} × ${e.mechanism}] ${e.title} (${e.source})`).join("\n") : "- (canvas is empty)"}

Generate the 6–8 concept seeds now, spread across different cells.`;

  const anthropic = new Anthropic();
  try {
    const response = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      system,
      messages: [{ role: "user", content: user }],
      output_config: { format: { type: "json_schema", schema: SUGGEST_SCHEMA } },
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    let seeds: Seed[];
    try {
      const parsed = JSON.parse(text) as { concepts?: Seed[] };
      seeds = Array.isArray(parsed.concepts) ? parsed.concepts : [];
    } catch {
      return NextResponse.json(
        { error: "The AI returned an unparsable response — try again." },
        { status: 502 }
      );
    }

    // Validate keys (belt-and-suspenders on top of the schema enums), trim,
    // cap at 8, and skip cells that already hold an AI concept with the same
    // title — re-running the suggester must not pile up duplicates.
    const seen = new Set(
      existing
        .filter((e) => e.source === "ai")
        .map((e) => `${e.moment}|${e.mechanism}|${e.title.trim().toLowerCase()}`)
    );
    const now = new Date().toISOString();
    const statements = [];
    for (const seed of seeds.slice(0, 8)) {
      const title = String(seed.title ?? "").trim().slice(0, 90);
      const description = String(seed.description ?? "").trim().slice(0, 600);
      if (!title) continue;
      if (!isMomentKey(sector, seed.moment) || !isMechanismKey(seed.mechanism)) continue;
      const dedupeKey = `${seed.moment}|${seed.mechanism}|${title.toLowerCase()}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      statements.push({
        sql: `INSERT INTO concepts (id, sprint_id, title, moment, mechanism, description, source, chosen, created_at)
              VALUES (?, ?, ?, ?, ?, ?, 'ai', 0, ?)`,
        args: [
          `con_${randomBytes(6).toString("hex")}`,
          id,
          title,
          seed.moment,
          seed.mechanism,
          description || null,
          now,
        ],
      });
    }
    if (statements.length > 0) await c.batch(statements, "write");

    return NextResponse.json({ ok: true, added: statements.length });
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
