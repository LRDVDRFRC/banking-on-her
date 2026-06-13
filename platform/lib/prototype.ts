// Phase 5 (14:00–17:00): each chosen concept becomes a testable package —
// (1) a value proposition, (2) a clickable phone-mock screen, (3) the evening
// test script. One Claude call generates all three; the result is stored in
// concepts.prototype_json and rendered on the facilitator build pod and the
// token-gated evening station view. Everything the panel sees is DUTCH.

import Anthropic from "@anthropic-ai/sdk";
import { sectorVocab } from "@/lib/sectors";

export interface PrototypeInput {
  client: string;
  sectorKey: string;
  concept: {
    title: string;
    /** Cell on the ideation canvas: the trigger moment… */
    moment: string;
    /** …× the behavioural mechanism. */
    mechanism: string;
    description: string | null;
  };
  findingsContext: {
    /** Dutch labels of the two lowest-scoring readiness dimensions. */
    lowestDims: string[];
    /** Verbatim "## Hooks for the sprint" markdown (English), if researched. */
    hooks: string | null;
    /** Dutch verbatim quotes from the AI intake interviews (up to 5). */
    quotes: string[];
  };
}

export interface PrototypeValueprop {
  /** Dutch headline, ≤8 words. */
  kop: string;
  /** One Dutch sentence. */
  subkop: string;
  /** Exactly 3 Dutch bullets. */
  bullets: string[];
}

export interface PrototypeTestScript {
  /** What the panel host reads aloud — neutral, non-leading Dutch. */
  intro: string;
  /** 2–3 tasks ("vind uit wat dit scherm je vertelt…"). */
  tasks: string[];
  /** 4–5 open questions (begrip, relevantie, vertrouwen, gebruik, prijs-/actiebereidheid). */
  questions: string[];
}

/** Contract of concepts.prototype_json. */
export interface Prototype {
  valueprop: PrototypeValueprop;
  /** Self-contained mobile screen (HTML + <style> + minimal inline JS), Dutch. */
  screen_html: string;
  test_script: PrototypeTestScript;
}

const PROTOTYPE_SCHEMA = {
  type: "object",
  properties: {
    valueprop: {
      type: "object",
      properties: {
        kop: { type: "string" },
        subkop: { type: "string" },
        bullets: { type: "array", items: { type: "string" } },
      },
      required: ["kop", "subkop", "bullets"],
      additionalProperties: false,
    },
    screen_html: { type: "string" },
    test_script: {
      type: "object",
      properties: {
        intro: { type: "string" },
        tasks: { type: "array", items: { type: "string" } },
        questions: { type: "array", items: { type: "string" } },
      },
      required: ["intro", "tasks", "questions"],
      additionalProperties: false,
    },
  },
  required: ["valueprop", "screen_html", "test_script"],
  additionalProperties: false,
} as const;

/** Tolerant parse of a stored concepts.prototype_json value. */
export function parsePrototype(raw: unknown): Prototype | null {
  if (raw == null) return null;
  try {
    const p = JSON.parse(String(raw)) as Prototype;
    if (
      typeof p?.screen_html !== "string" ||
      typeof p?.valueprop?.kop !== "string" ||
      typeof p?.test_script?.intro !== "string"
    ) {
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

/**
 * Generate the full testable package for one chosen concept.
 * One claude-opus-4-8 call with adaptive thinking + structured output.
 */
export async function generatePrototype(input: PrototypeInput): Promise<Prototype> {
  const vocab = sectorVocab(input.sectorKey);
  const anthropic = new Anthropic();

  const system = `You are Unlockt's proposition designer in the Gender Capital Lab Sprint. Between 14:00 and 17:00 each chosen concept becomes a TESTABLE package for ${input.client} (a Dutch ${vocab.instelling}). Tonight, 6–8 women from the target group sit at tablet stations and judge it. You produce three artifacts in ONE response. ALL content the panel sees is DUTCH — natural, warm, concrete bank-app Dutch; never English, NEVER lorem ipsum or placeholder text.

1. screen_html — the clickable phone mock. It must feel like a REAL screen of ${input.client}'s own app (${vocab.app}), not a wireframe. Requirements:
- One core flow visible on a single screen: the trigger moment, then the insight, then ONE clear primary action.
- Self-contained HTML with inline CSS only: a single <style> block plus inline styles is fine; minimal inline JS for a tap state (e.g. a button press revealing a confirmation) is allowed. NO external resources of any kind — no http(s) URLs, no web fonts, no images, no frameworks, no <script src>. Icons: use unicode/emoji or pure CSS.
- Designed for a 390px-wide mobile viewport (the host iframe is 390×760). Use system-ui font stack.
- Neutral, modern bank-app aesthetic: white background, dark ink text (#0D2B23-ish), ONE accent color used sparingly. No gradients-everywhere AI look.
- Anchor every number in the findings context provided (hooks, quotes, readiness gaps). Realistic Dutch amounts, percentages and names — never invented precision beyond what the context supports.

2. test_script — for the panel host at the station:
- intro: 2–4 sentences the host reads aloud before handing over the tablet. Neutral and non-leading: it explains the situation/moment, never sells the concept or hints at the "right" answer.
- tasks: 2–3 concrete tasks, e.g. "Vind uit wat dit scherm je vertelt over je pensioen."
- questions: 4–5 open questions covering begrip (what do you think this is?), relevantie (is this about your life?), vertrouwen (would you trust this from ${input.client}?), gebruik (would you act on it, when?), and prijs-/actiebereidheid (what would you give/do for this?). Open phrasing, no yes/no questions.

3. valueprop — the one-liner above the prototype:
- kop: maximum 8 Dutch words, sharp, no jargon.
- subkop: exactly 1 sentence.
- bullets: exactly 3 short benefit bullets, each anchored in the concept's mechanism.`;

  const user = `CONCEPT TO BUILD
Titel: ${input.concept.title}
Moment (trigger): ${input.concept.moment}
Mechanisme: ${input.concept.mechanism}
Beschrijving: ${input.concept.description ?? "(geen — bouw vanuit titel, moment en mechanisme)"}

FINDINGS CONTEXT (anchor the screen's numbers and copy here)
Zwakste readiness-dimensies van ${input.client}: ${input.findingsContext.lowestDims.join(", ") || "(nog niet gemeten)"}

Hooks uit het marktonderzoek (Engels — vertaal cijfers naar natuurlijk Nederlands):
${input.findingsContext.hooks ?? `(geen onderzoek beschikbaar — gebruik algemeen bekende cijfers over de ${vocab.kloof} voorzichtig en zonder schijnprecisie)`}

Citaten uit de intake-interviews van het team (Nederlands, verbatim):
${input.findingsContext.quotes.length > 0 ? input.findingsContext.quotes.map((q) => `- "${q}"`).join("\n") : "(geen)"}

Doelgroep vanavond: 6–8 vrouwen (${vocab.klanten} of potentiële ${vocab.klanten}), getest op tablets, één station per concept.`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    system,
    messages: [{ role: "user", content: user }],
    output_config: { format: { type: "json_schema", schema: PROTOTYPE_SCHEMA } },
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  const proto = JSON.parse(text) as Prototype;

  // Hard guarantees for the renderers.
  if (!proto.screen_html || proto.screen_html.trim().length < 200) {
    throw new Error("Prototype generation returned an empty or trivial screen.");
  }
  proto.valueprop.bullets = (proto.valueprop.bullets ?? []).slice(0, 3);
  proto.test_script.tasks = (proto.test_script.tasks ?? []).slice(0, 3);
  proto.test_script.questions = (proto.test_script.questions ?? []).slice(0, 5);
  if (
    proto.valueprop.bullets.length === 0 ||
    proto.test_script.tasks.length === 0 ||
    proto.test_script.questions.length === 0
  ) {
    throw new Error("Prototype generation returned an incomplete package.");
  }
  return proto;
}
