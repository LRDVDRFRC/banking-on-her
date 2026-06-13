// AI-composed Dutch pre-read: the T–1 teaser document sent to the client crew
// the evening before the sprint. Composed once from the sprint's own data
// (scores, research hooks) and stored in sprints.preread_json.

import Anthropic from "@anthropic-ai/sdk";
import { sectorVocab } from "@/lib/sectors";

export interface PrereadInput {
  client: string;
  /** Dutch-formatted sprint date, e.g. "26 juni 2026" (or null). */
  sprintDate: string | null;
  sectorKey: string;
  /** Overall readiness pct + band label, or null when no assessments yet. */
  overallPct: number | null;
  band: string | null;
  /** Dutch labels of the two lowest dimensions. */
  lowestDims: string[];
  /** Raw markdown of the "## Hooks for the sprint" section (English), if any. */
  hooksMarkdown: string | null;
  participantCount: number;
}

export interface PrereadDoc {
  /** 2–3 sentences: welcome + what tomorrow is. */
  intro: string;
  /** 2–3 sentences: where the room stands (overall only — no reveal). */
  reflectie: string;
  /** Exactly 3 teasers: sharp Dutch headline + one-sentence tension-builder. */
  teasers: { kop: string; zin: string }[];
  /** 1–2 sentences on the evening test panel commitment. */
  avond: string;
  /** 1 closing sentence. */
  afsluiting: string;
}

const PREREAD_SCHEMA = {
  type: "object",
  properties: {
    intro: { type: "string" },
    reflectie: { type: "string" },
    teasers: {
      type: "array",
      items: {
        type: "object",
        properties: { kop: { type: "string" }, zin: { type: "string" } },
        required: ["kop", "zin"],
        additionalProperties: false,
      },
    },
    avond: { type: "string" },
    afsluiting: { type: "string" },
  },
  required: ["intro", "reflectie", "teasers", "avond", "afsluiting"],
  additionalProperties: false,
} as const;

export async function generatePreread(input: PrereadInput): Promise<PrereadDoc> {
  const vocab = sectorVocab(input.sectorKey);
  const anthropic = new Anthropic();

  const system = `Je schrijft de "pre-read" voor Unlockt's Gender Capital Lab Sprint: het document dat de avond vóór de sprintdag naar het team van de klant gaat. Toon: warm, direct, commercieel, geen jargon, geen DEI-taal — zakelijk Nederlands zoals een topadviseur het zou schrijven. Het is een TEASER: het wekt nieuwsgierigheid maar verklapt de ochtendpresentatie niet. Verwijs nooit naar individuele antwoorden of meningsverschillen in het team — dat is de onthulling van morgen.

Schrijf alle velden in het Nederlands. De teasers zijn herschrijvingen van de Engelse "hooks" uit ons marktonderzoek: maak er Nederlandse prikkels van — kop van max 8 woorden plus één zin die spanning opbouwt zonder het antwoord te geven. Cijfers uit de hooks mag je noemen; bronnen morgen.`;

  const user = `Klant: ${input.client} (${vocab.instelling})
Sprintdag: ${input.sprintDate ?? "binnenkort"}
Aantal teamleden dat de intake deed: ${input.participantCount}
Totale readiness: ${input.overallPct !== null ? `${input.overallPct}% (${input.band})` : "nog niet gemeten"}
De dag richt zich waarschijnlijk op: ${input.lowestDims.join(" en ") || "wordt morgen onthuld"}

Engelse hooks uit het marktonderzoek (herschrijf de 3 sterkste als Nederlandse teasers):
${input.hooksMarkdown ?? "(geen — schrijf 3 teasers over de pensioenkloof/vermogenskloof voor vrouwen in het algemeen, passend bij de sector)"}

Het programma van morgen, ter context voor "avond": 09:00 de spiegel (bevindingen), 10:00 het doel van de dag, daarna discovery en ideation, 14:00–17:00 bouwen met AI (3–5 prototypes), 18:00–21:00 testen met 6–8 vrouwen uit de doelgroep, de ochtend erna de beslissing.`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2048,
    thinking: { type: "adaptive" },
    system,
    messages: [{ role: "user", content: user }],
    output_config: { format: { type: "json_schema", schema: PREREAD_SCHEMA } },
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  const doc = JSON.parse(text) as PrereadDoc;
  // Hard guarantee for the renderer: exactly 3 teasers.
  doc.teasers = (doc.teasers ?? []).slice(0, 3);
  if (doc.teasers.length === 0) {
    throw new Error("Pre-read generation returned no teasers.");
  }
  return doc;
}
