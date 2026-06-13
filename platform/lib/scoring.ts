// Scoring backbone for the Unlockt Gender Capital Readiness self-assessment.
// The 29 statements are sector-aware TEMPLATES: tokens like {KLANT}/{KLANTEN}/
// {APP}/{PRODUCT}/{INSTELLING} resolve via lib/sectors.ts, and statements that
// are too pension-specific for tokens alone carry a per-sector override.
// HARD INVARIANT: for sector "pensioen" the resolved statements are
// byte-identical to sprint/05_self-assessment-form.html (the offline tool).
// Scores are always shown as percentage rings — never letter grades.

import {
  applyVocab,
  sectorVocab,
  type SectorKey,
} from "@/lib/sectors";

export type DimensionKey =
  | "mens_organisatie"
  | "data"
  | "marketing_communicatie"
  | "ecosystemen"
  | "proposities";

export interface Dimension {
  key: DimensionKey;
  label: string;
  desc: string;
  accent: string;
  questions: string[];
}

// NOTE: `questions` and `desc` are templates — resolve them with
// getStatements(sector) / getDimensionDescs(sector) before showing to clients.
export const DIMENSIONS: Dimension[] = [
  {
    key: "mens_organisatie",
    label: "Mens & organisatie",
    desc: "Bias in onze eigen mensen, prikkels en beslissystemen.",
    accent: "var(--sky)",
    questions: [
      "Onze product-, data- en marketingteams kunnen het cijfer van de {KLOOF} tussen mannen en vrouwen in ons eigen {KLANTEN}bestand noemen.",
      "Het dichten van de kloof in {UITKOMSTEN} staat in iemands echte doelstellingen of KPI’s (niet alleen in een waardenstatement).",
      "Als we een default ontwerpen (inleg, beleggingsprofiel), toetsen we het verschil in effect op vrouwen en mannen.",
      "We hebben intern de capaciteit (of een partner) om een genderanalyse uit te voeren zonder bij nul te beginnen.",
      "De directie behandelt de {KLOOF} van vrouwen als een commercieel onderwerp, niet alleen als een ESG- of rapportagethema.",
      "Bij besluiten over het ontwerp van de regeling wegen we deeltijdwerk en loopbaanonderbrekingen expliciet mee.",
    ],
  },
  {
    key: "data",
    label: "Data",
    desc: "Kunnen we de kloof überhaupt zien? Omzet-, funnel- en uitkomstdata naar geslacht.",
    accent: "var(--rose)",
    questions: [
      "We kunnen ons {KLANTEN}bestand vandaag uitsplitsen naar geslacht × leeftijd × opgebouwd pensioen × inlegpercentage.",
      "We volgen app-gebruik (logins in {APP}, gemaakte keuzes) uitgesplitst naar geslacht.",
      "We zien waar vrouwen afhaken of passief blijven in belangrijke klantreizen (onboarding, inlegkeuze, waardeoverdracht).",
      "We meten de verwachte kloof in pensioeninkomen voor onze vrouwelijke {KLANTEN}, niet alleen de huidige opbouw.",
      "We leggen levensgebeurtenissen (urenwijziging, ouderschapsverlof, salariswijziging) vast als data waar we op kunnen handelen.",
      "We vergelijken onze kloof met die van andere {INSTELLINGEN} en met landelijke cijfers.",
    ],
  },
  {
    key: "marketing_communicatie",
    label: "Marketing & communicatie",
    desc: "Bereiken, raken en bewegen onze boodschappen vrouwelijke {KLANTEN}?",
    accent: "var(--amber)",
    questions: [
      "Onze communicatie rond onboarding en levensgebeurtenissen wordt getest op hoe die specifiek bij vrouwen landt.",
      "We sturen een bericht op de momenten die de kloof vergroten (parttime gaan werken, ouderschapsverlof).",
      "Onze toon en voorbeelden gaan uit van diverse levenspaden, niet van een standaard fulltime, rechtlijnige carrière.",
      "Campagnes worden afgerekend op of ze het gedrag van vrouwen veranderden (inleg, keuzes), niet alleen op bereik.",
      "Marketing- en communicatiecollega’s zijn getraind om genderaannames in hun eigen teksten te herkennen.",
      "We kunnen onze communicatie doorlopend scannen op deze blinde vlekken, niet alleen met een eenmalige audit.",
    ],
  },
  {
    key: "ecosystemen",
    label: "Ecosystemen",
    desc: "Werkgevers, adviseurs en partners — het kanaal naar de {KLANT}.",
    accent: "var(--mint)",
    questions: [
      "We geven werkgevers data en tools over de {KLOOF} in hun eigen personeelsbestand.",
      "Adviseurs die onze regelingen verkopen of beheren, zijn toegerust om de kloof bij werkgevers aan te kaarten.",
      "We werken samen met organisaties die vrouwen vertrouwen op de relevante levensmomenten.",
      "Bij de onboarding van werkgevers hoort een gesprek over het dichten van de kloof, niet alleen over kosten en compliance.",
      "We hebben verwijzings- en partnerroutes die specifiek onderbediende {KLANTEN} bereiken.",
    ],
  },
  {
    key: "proposities",
    label: "Proposities",
    desc: "Passen onze producten en defaults echt bij de {REALITEIT} van vrouwen?",
    accent: "var(--sky)",
    questions: [
      "We bieden een product, default of functie die expliciet is ontworpen om het deeltijd- en loopbaanonderbrekingsnadeel te verzachten.",
      "Onze defaults staan zo dat niets doen de kloof verkleint in plaats van vergroot.",
      "{KLANTEN} krijgen een helder, persoonlijk beeld van hun verwachte kloof en van wat die dicht.",
      "We maken het makkelijk om in actie te komen op het moment dat het ertoe doet (bijstorten rond ouderschapsverlof, aanpassen bij een urenwijziging).",
      "We hebben minstens één kloof-dichtende propositie getest met echte {KLANTEN}.",
      "Een {KLANT} zou zeggen dat onze propositie bij haar of hem past, ongeacht de vorm van de loopbaan.",
    ],
  },
];

// ---------------------------------------------------------------- overrides
// Per-sector full-statement overrides, keyed by flat statement index (0–28),
// for statements where the pension original is too specific for tokens alone.
// Override strings may themselves contain tokens (resolved afterwards).
// No "pensioen" entries: the templates above ARE the pension originals.

type Overrides = Partial<Record<Exclude<SectorKey, "pensioen">, string>>;

/** Same override string for every non-pensioen sector. */
function forAllOthers(s: string): Overrides {
  return { bank: s, verzekeraar: s, vermogensbeheer: s, hypotheek: s, algemeen: s };
}

const STATEMENT_OVERRIDES: Record<number, Overrides> = {
  // M&O 3 — default examples
  2: {
    bank: "Als we een default ontwerpen (spaarrekening, kredietlimiet), toetsen we het verschil in effect op vrouwen en mannen.",
    verzekeraar: "Als we een default ontwerpen (dekking, premieopbouw), toetsen we het verschil in effect op vrouwen en mannen.",
    vermogensbeheer: "Als we een default ontwerpen (inleg, risicoprofiel), toetsen we het verschil in effect op vrouwen en mannen.",
    hypotheek: "Als we een default ontwerpen (looptijd, aflosvorm), toetsen we het verschil in effect op vrouwen en mannen.",
    algemeen: "Als we een default ontwerpen (productinstellingen, voorwaarden), toetsen we het verschil in effect op vrouwen en mannen.",
  },
  // M&O 6 — "het ontwerp van de regeling"
  5: forAllOthers(
    "Bij besluiten over het ontwerp van onze {PRODUCT} wegen we deeltijdwerk en loopbaanonderbrekingen expliciet mee."
  ),
  // Data 1 — split metrics
  6: {
    bank: "We kunnen ons {KLANTEN}bestand vandaag uitsplitsen naar geslacht × leeftijd × vermogen × productbezit.",
    verzekeraar: "We kunnen ons {KLANTEN}bestand vandaag uitsplitsen naar geslacht × leeftijd × dekking × premie.",
    vermogensbeheer: "We kunnen ons {KLANTEN}bestand vandaag uitsplitsen naar geslacht × leeftijd × belegd vermogen × inleg.",
    hypotheek: "We kunnen ons {KLANTEN}bestand vandaag uitsplitsen naar geslacht × leeftijd × hypotheeksom × aflossing.",
    algemeen: "We kunnen ons {KLANTEN}bestand vandaag uitsplitsen naar geslacht × leeftijd × productbezit × saldo.",
  },
  // Data 3 — journey examples
  8: {
    bank: "We zien waar vrouwen afhaken of passief blijven in belangrijke klantreizen (onboarding, sparen, beleggen).",
    verzekeraar: "We zien waar vrouwen afhaken of passief blijven in belangrijke klantreizen (aanvraag, dekkingskeuze, claim).",
    vermogensbeheer: "We zien waar vrouwen afhaken of passief blijven in belangrijke klantreizen (onboarding, inlegkeuze, herbalancering).",
    hypotheek: "We zien waar vrouwen afhaken of passief blijven in belangrijke klantreizen (oriëntatie, aanvraag, oversluiten).",
    algemeen: "We zien waar vrouwen afhaken of passief blijven in belangrijke klantreizen (onboarding, productkeuze, gebruik).",
  },
  // Data 4 — expected gap measure
  9: {
    bank: "We meten de verwachte kloof in vermogensopbouw voor onze vrouwelijke {KLANTEN}, niet alleen het huidige saldo.",
    verzekeraar: "We meten de verwachte kloof in dekking en uitkering voor onze vrouwelijke {KLANTEN}, niet alleen de huidige polissen.",
    vermogensbeheer: "We meten de verwachte kloof in beleggingsvermogen voor onze vrouwelijke {KLANTEN}, niet alleen de huidige inleg.",
    hypotheek: "We meten de verwachte kloof in woningvermogen voor onze vrouwelijke {KLANTEN}, niet alleen de huidige leensom.",
    algemeen: "We meten de verwachte kloof in financiële uitkomsten voor onze vrouwelijke {KLANTEN}, niet alleen de huidige cijfers.",
  },
  // Marcom 4 — behaviour examples ({vermogensbeheer} keeps "(inleg, keuzes)")
  15: {
    bank: "Campagnes worden afgerekend op of ze het gedrag van vrouwen veranderden (sparen, beleggen, keuzes), niet alleen op bereik.",
    verzekeraar: "Campagnes worden afgerekend op of ze het gedrag van vrouwen veranderden (dekking, keuzes), niet alleen op bereik.",
    hypotheek: "Campagnes worden afgerekend op of ze het gedrag van vrouwen veranderden (aflossen, keuzes), niet alleen op bereik.",
    algemeen: "Campagnes worden afgerekend op of ze het gedrag van vrouwen veranderden (productgebruik, keuzes), niet alleen op bereik.",
  },
  // Eco 1 — employers as the channel
  18: {
    bank: "We geven partners en intermediairs data en tools over de {KLOOF} in hun eigen achterban.",
    verzekeraar: "We geven adviseurs en werkgevers data en tools over de {KLOOF} in hun eigen portefeuille.",
    vermogensbeheer: "We geven adviseurs en partners data en tools over de {KLOOF} in hun eigen portefeuille.",
    hypotheek: "We geven hypotheekadviseurs data en tools over de {KLOOF} in hun eigen klantportefeuille.",
    algemeen: "We geven partners in ons kanaal data en tools over de {KLOOF} in hun eigen achterban.",
  },
  // Eco 2 — advisers selling "regelingen"
  19: forAllOthers(
    "Adviseurs en intermediairs die onze {PRODUCT} verkopen of beheren, zijn toegerust om de kloof bij {KLANTEN} aan te kaarten."
  ),
  // Eco 4 — employer onboarding
  21: forAllOthers(
    "Bij de onboarding van nieuwe {KLANTEN} hoort een gesprek over het dichten van de kloof, niet alleen over kosten en voorwaarden."
  ),
  // Prop 4 — act-in-the-moment examples
  26: {
    bank: "We maken het makkelijk om in actie te komen op het moment dat het ertoe doet (extra sparen rond ouderschapsverlof, aanpassen bij een inkomenswijziging).",
    verzekeraar: "We maken het makkelijk om in actie te komen op het moment dat het ertoe doet (dekking aanpassen rond ouderschapsverlof of een urenwijziging).",
    vermogensbeheer: "We maken het makkelijk om in actie te komen op het moment dat het ertoe doet (extra inleggen rond ouderschapsverlof, aanpassen bij een inkomenswijziging).",
    hypotheek: "We maken het makkelijk om in actie te komen op het moment dat het ertoe doet (aflossing of looptijd aanpassen rond ouderschapsverlof of een urenwijziging).",
    algemeen: "We maken het makkelijk om in actie te komen op het moment dat het ertoe doet (bijsturen rond ouderschapsverlof, aanpassen bij een urenwijziging).",
  },
};

function resolveStatement(template: string, index: number, sector: string): string {
  const vocab = sectorVocab(sector);
  const overridden =
    sector !== "pensioen"
      ? STATEMENT_OVERRIDES[index]?.[sector as Exclude<SectorKey, "pensioen">] ?? template
      : template;
  const resolved = applyVocab(overridden, vocab);
  // Statements may start with a token ({KLANTEN} krijgen…) — recapitalise.
  return resolved.charAt(0).toUpperCase() + resolved.slice(1);
}

/**
 * The 29 statements resolved for a sector, flat, in dimension order
 * (mens_organisatie 6 · data 6 · marketing_communicatie 6 · ecosystemen 5 ·
 * proposities 6). For "pensioen" this is byte-identical to the offline tool.
 */
export function getStatements(sector: string): string[] {
  const out: string[] = [];
  let index = 0;
  for (const dim of DIMENSIONS) {
    for (const q of dim.questions) {
      out.push(resolveStatement(q, index, sector));
      index++;
    }
  }
  return out;
}

/** The five dimension descriptions resolved for a sector (same order). */
export function getDimensionDescs(sector: string): string[] {
  const vocab = sectorVocab(sector);
  return DIMENSIONS.map((d) => applyVocab(d.desc, vocab));
}

export const DIMENSION_KEYS: DimensionKey[] = DIMENSIONS.map((d) => d.key);

export const TOTAL_QUESTIONS = DIMENSIONS.reduce(
  (acc, d) => acc + d.questions.length,
  0
); // 29

/** The 0–4 scale legend, verbatim from the offline self-assessment form. */
export const SCALE: { value: number; text: string; color: string }[] = [
  { value: 0, text: "Niet waar / doen we niet / weet ik niet", color: "var(--amber)" },
  { value: 1, text: "Ad hoc, geïsoleerd, initiatief van één persoon", color: "var(--rose)" },
  { value: 2, text: "Gebeurt deels, inconsistent, niet gemeten", color: "var(--rose)" },
  { value: 3, text: "Consistent en gemeten, stuurt nog geen besluiten", color: "var(--sky)" },
  { value: 4, text: "Systematisch, gemeten, en het verandert wat we doen", color: "var(--mint)" },
];

export interface Band {
  label: string;
  color: string;
  desc: string;
}

/** Bands: 0–34 blinde vlek (amber) · 35–59 latent (rose) · 60–79 in opbouw (sky) · 80–100 koploper (mint). */
export function bandFor(pct: number): Band {
  if (pct >= 80) return { label: "koploper", color: "var(--mint)", desc: "Toonaangevend — gender-bewust by design" };
  if (pct >= 60) return { label: "in opbouw", color: "var(--sky)", desc: "Bewust, deels systematisch" };
  if (pct >= 35) return { label: "latent", color: "var(--rose)", desc: "Activiteit in pockets, nog geen systeem" };
  return { label: "blinde vlek", color: "var(--amber)", desc: "De kans is nog onaangeroerd" };
}

export const BAND_LEGEND =
  "0–34% blinde vlek · 35–59% latent · 60–79% in opbouw · 80–100% koploper";

/** Dimension percentage: sum of 0–4 answers over the dimension's max (4 × n). */
export function dimensionPct(answers: number[]): number {
  const sum = answers.reduce((a, b) => a + b, 0);
  return Math.round((sum / (4 * answers.length)) * 100);
}

/** Overall percentage: rounded mean of the five dimension percentages. */
export function overallPct(pcts: number[]): number {
  return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
}

/** Merge across respondents: rounded mean of one dimension's percentages. */
export function mergePcts(values: number[]): number {
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}
