// Morning-after readout (Phase 7): one Claude call that synthesizes the
// evening panel's feedback rows into a ranking + recommendation. Stored in
// sprints.readout_json (+ readout_at).
//
// READOUT_JSON CONTRACT (what lands in sprints.readout_json):
// {
//   samenvatting: string            — EN, 3–4 sentences for the facilitators
//   ranking: [{                     — ordered best → worst
//     conceptId: string,
//     title: string,
//     gemiddelden: { gebruiken, begrijpen, vertrouwen },  — 1 decimal, /5
//     verdict: string,              — EN, 1 sentence
//     resoneerde: string[],         — Dutch, anchored in verbatim quotes
//     schuurde: string[]            — Dutch, what fell flat / confused
//   }],
//   aanbeveling: {
//     conceptId: string,
//     title: string,
//     rationale: string,            — EN, 2–3 sentences: pilot this one because…
//     voorwaarden: string[]         — EN, what must be fixed before piloting
//   }
// }

import Anthropic from "@anthropic-ai/sdk";
import { sectorVocab } from "@/lib/sectors";

export interface ReadoutFeedbackRow {
  panelist: string;
  scores: { gebruiken: number; begrijpen: number; vertrouwen: number };
  quotes: string | null;
  observations: string | null;
}

export interface ReadoutConceptInput {
  id: string;
  title: string;
  moment: string;
  mechanism: string;
  /** Headline of the prototype's value proposition (Phase 5), if built. */
  valuepropKop: string | null;
  feedback: ReadoutFeedbackRow[];
}

export interface ReadoutInput {
  client: string;
  sectorKey: string;
  concepts: ReadoutConceptInput[];
}

export interface ReadoutAverages {
  gebruiken: number;
  begrijpen: number;
  vertrouwen: number;
}

export interface ReadoutRankingEntry {
  conceptId: string;
  title: string;
  gemiddelden: ReadoutAverages;
  /** EN, 1 sentence. */
  verdict: string;
  /** Dutch, anchored in the verbatim quotes. */
  resoneerde: string[];
  /** Dutch. */
  schuurde: string[];
}

export interface ReadoutDoc {
  samenvatting: string;
  ranking: ReadoutRankingEntry[];
  aanbeveling: {
    conceptId: string;
    title: string;
    rationale: string;
    voorwaarden: string[];
  };
}

const READOUT_SCHEMA = {
  type: "object",
  properties: {
    samenvatting: { type: "string" },
    ranking: {
      type: "array",
      items: {
        type: "object",
        properties: {
          conceptId: { type: "string" },
          title: { type: "string" },
          gemiddelden: {
            type: "object",
            properties: {
              gebruiken: { type: "number" },
              begrijpen: { type: "number" },
              vertrouwen: { type: "number" },
            },
            required: ["gebruiken", "begrijpen", "vertrouwen"],
            additionalProperties: false,
          },
          verdict: { type: "string" },
          resoneerde: { type: "array", items: { type: "string" } },
          schuurde: { type: "array", items: { type: "string" } },
        },
        required: ["conceptId", "title", "gemiddelden", "verdict", "resoneerde", "schuurde"],
        additionalProperties: false,
      },
    },
    aanbeveling: {
      type: "object",
      properties: {
        conceptId: { type: "string" },
        title: { type: "string" },
        rationale: { type: "string" },
        voorwaarden: { type: "array", items: { type: "string" } },
      },
      required: ["conceptId", "title", "rationale", "voorwaarden"],
      additionalProperties: false,
    },
  },
  required: ["samenvatting", "ranking", "aanbeveling"],
  additionalProperties: false,
} as const;

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Per-concept score averages, 1 decimal — computed in TS, never by the model. */
export function feedbackAverages(rows: ReadoutFeedbackRow[]): ReadoutAverages {
  const n = Math.max(1, rows.length);
  const sum = (k: keyof ReadoutAverages) => rows.reduce((a, r) => a + r.scores[k], 0);
  return {
    gebruiken: round1(sum("gebruiken") / n),
    begrijpen: round1(sum("begrijpen") / n),
    vertrouwen: round1(sum("vertrouwen") / n),
  };
}

export async function generateReadout(input: ReadoutInput): Promise<ReadoutDoc> {
  const totalRows = input.concepts.reduce((a, c) => a + c.feedback.length, 0);
  if (totalRows === 0) {
    throw new Error("Readout needs at least one feedback row from the evening panel.");
  }

  const vocab = sectorVocab(input.sectorKey);
  const averages = new Map(
    input.concepts.map((c) => [c.id, feedbackAverages(c.feedback)])
  );
  const titles = new Map(input.concepts.map((c) => [c.id, c.title]));

  const system = `You synthesize the morning-after readout for Unlockt's Gender Capital Lab Sprint. Yesterday evening, 6–8 women from the target group rotated along prototype stations; the panel host captured per panelist × concept three 1–5 scores (zou ik gebruiken / begrijp ik meteen / vertrouw ik), verbatim Dutch quotes, and observations. This morning the facilitators present the verdict to the client and pick the pilot.

Rules:
- "samenvatting": ENGLISH, 3–4 sentences for the facilitators — the headline of the evening, the spread between concepts, and where the decision points.
- "ranking": ALL concepts, ordered best → worst on the evidence (scores AND qualitative signal). For each: copy "gemiddelden" EXACTLY as provided per concept — they are pre-computed; do not recalculate or change them. "verdict" is ONE English sentence. "resoneerde" entries are DUTCH and anchored in the verbatim quotes — quote or closely paraphrase what panelists actually said; never invent quotes. "schuurde" entries are DUTCH: what fell flat, confused or undermined trust, drawn from low scores, quotes and observations.
- "aanbeveling": pick the concept to pilot (usually the ranking winner, but a clear qualitative signal may override a small score gap — if so, say why). "rationale" is ENGLISH, 2–3 sentences: pilot this one because… "voorwaarden" are ENGLISH: the concrete things that must be fixed before piloting, taken from what schuurde.
- Use only the provided data. Small panel (n≤8): present signals as signals, not statistics.`;

  const conceptBlocks = input.concepts
    .map((c) => {
      const avg = averages.get(c.id)!;
      const rows = c.feedback
        .map(
          (f) =>
            `  - Panelist ${f.panelist}: gebruiken ${f.scores.gebruiken}/5, begrijpen ${f.scores.begrijpen}/5, vertrouwen ${f.scores.vertrouwen}/5
    Quotes: ${f.quotes?.trim() || "(none captured)"}
    Observations: ${f.observations?.trim() || "(none captured)"}`
        )
        .join("\n");
      return `### Concept ${c.id} — "${c.title}"
Cell: ${c.moment} × ${c.mechanism}
Value proposition headline: ${c.valuepropKop ?? "(prototype headline not available)"}
PRE-COMPUTED averages over ${c.feedback.length} panelist(s) — copy verbatim into gemiddelden: gebruiken ${avg.gebruiken}, begrijpen ${avg.begrijpen}, vertrouwen ${avg.vertrouwen}
Feedback rows:
${rows || "  (none)"}`;
    })
    .join("\n\n");

  const user = `Client: ${input.client} (${vocab.instelling}, sector: ${vocab.label})
Concepts tested last evening (${input.concepts.length}), with the panel's captured feedback:

${conceptBlocks}`;

  const anthropic = new Anthropic();
  const response = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    system,
    messages: [{ role: "user", content: user }],
    output_config: { format: { type: "json_schema", schema: READOUT_SCHEMA } },
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  const doc = JSON.parse(text) as ReadoutDoc;

  // Hard guarantees for the renderer: math and titles come from the database,
  // not the model. Drop hallucinated concepts, re-anchor averages/titles, and
  // make sure every tested concept appears in the ranking (worst-case append).
  const known = new Set(input.concepts.map((c) => c.id));
  doc.ranking = (doc.ranking ?? []).filter((r) => known.has(r.conceptId));
  const ranked = new Set(doc.ranking.map((r) => r.conceptId));
  for (const c of input.concepts) {
    if (!ranked.has(c.id)) {
      doc.ranking.push({
        conceptId: c.id,
        title: c.title,
        gemiddelden: averages.get(c.id)!,
        verdict: "Not assessed by the synthesis — review the raw feedback.",
        resoneerde: [],
        schuurde: [],
      });
    }
  }
  for (const r of doc.ranking) {
    r.gemiddelden = averages.get(r.conceptId)!;
    r.title = titles.get(r.conceptId)!;
  }
  if (!known.has(doc.aanbeveling?.conceptId)) {
    const top = doc.ranking[0];
    doc.aanbeveling = {
      conceptId: top.conceptId,
      title: top.title,
      rationale: doc.aanbeveling?.rationale ?? "Highest-ranked concept on the evening's evidence.",
      voorwaarden: doc.aanbeveling?.voorwaarden ?? [],
    };
  } else {
    doc.aanbeveling.title = titles.get(doc.aanbeveling.conceptId)!;
  }
  return doc;
}
