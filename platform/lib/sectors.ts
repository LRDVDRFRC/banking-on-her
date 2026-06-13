// Sector & region registry for sector-aware sprints.
// Each sector carries the Dutch vocabulary used to resolve the assessment
// statement templates in lib/scoring.ts and the fixed client-facing copy.

export type SectorKey =
  | "pensioen"
  | "bank"
  | "verzekeraar"
  | "vermogensbeheer"
  | "hypotheek"
  | "algemeen";

export type RegionKey = "nl" | "eu" | "global";

export interface SectorVocab {
  /** Facilitator-facing sector label (Dutch domain term). */
  label: string;
  /** Client singular — {KLANT} */
  klant: string;
  /** Client plural — {KLANTEN} */
  klanten: string;
  /** Client-facing app name — {APP} */
  app: string;
  /** Product term (plural-ish) — {PRODUCT} */
  product: string;
  /** Institution term, singular — {INSTELLING} */
  instelling: string;
  /** Institution term, plural — {INSTELLINGEN} */
  instellingen: string;
  /** The gender gap as this sector names it — {KLOOF} */
  kloof: string;
  /** Outcome term for "kloof in …" — {UITKOMSTEN} */
  uitkomsten: string;
  /** "…realiteit van vrouwen" term — {REALITEIT} */
  realiteit: string;
}

export const SECTORS: Record<SectorKey, SectorVocab> = {
  pensioen: {
    label: "Pensioenuitvoerder",
    klant: "deelnemer",
    klanten: "deelnemers",
    app: "Mijn Pensioen",
    product: "pensioen",
    instelling: "pensioenuitvoerder",
    instellingen: "uitvoerders",
    kloof: "pensioenkloof",
    uitkomsten: "pensioenuitkomsten",
    realiteit: "pensioenrealiteit",
  },
  bank: {
    label: "Bank",
    klant: "klant",
    klanten: "klanten",
    app: "de bankapp",
    product: "bankproducten",
    instelling: "bank",
    instellingen: "banken",
    kloof: "vermogenskloof",
    uitkomsten: "financiële uitkomsten",
    realiteit: "financiële realiteit",
  },
  verzekeraar: {
    label: "Verzekeraar",
    klant: "polishouder",
    klanten: "polishouders",
    app: "het klantportaal",
    product: "verzekeringen",
    instelling: "verzekeraar",
    instellingen: "verzekeraars",
    kloof: "verzekeringskloof",
    uitkomsten: "financiële uitkomsten",
    realiteit: "financiële realiteit",
  },
  vermogensbeheer: {
    label: "Vermogensbeheerder",
    klant: "cliënt",
    klanten: "cliënten",
    app: "het klantportaal",
    product: "beleggingsproposities",
    instelling: "vermogensbeheerder",
    instellingen: "vermogensbeheerders",
    kloof: "beleggingskloof",
    uitkomsten: "beleggingsuitkomsten",
    realiteit: "financiële realiteit",
  },
  hypotheek: {
    label: "Hypotheekverstrekker",
    klant: "klant",
    klanten: "klanten",
    app: "het klantportaal",
    product: "hypotheken",
    instelling: "hypotheekverstrekker",
    instellingen: "hypotheekverstrekkers",
    kloof: "financieringskloof",
    uitkomsten: "financiële uitkomsten",
    realiteit: "financiële realiteit",
  },
  algemeen: {
    label: "Financiële instelling (algemeen)",
    klant: "klant",
    klanten: "klanten",
    app: "de app",
    product: "producten",
    instelling: "financiële instelling",
    instellingen: "instellingen",
    kloof: "financiële kloof",
    uitkomsten: "financiële uitkomsten",
    realiteit: "financiële realiteit",
  },
};

export const REGIONS: Record<RegionKey, string> = {
  nl: "Nederland",
  eu: "Europa",
  global: "Wereldwijd",
};

export const SECTOR_KEYS = Object.keys(SECTORS) as SectorKey[];
export const REGION_KEYS = Object.keys(REGIONS) as RegionKey[];

export const DEFAULT_SECTOR: SectorKey = "pensioen";
export const DEFAULT_REGION: RegionKey = "nl";

export function isSectorKey(v: string): v is SectorKey {
  return v in SECTORS;
}

export function isRegionKey(v: string): v is RegionKey {
  return v in REGIONS;
}

/** Vocabulary for a sector, falling back to the default (pensioen). */
export function sectorVocab(sector: string | null | undefined): SectorVocab {
  return SECTORS[sector && isSectorKey(sector) ? sector : DEFAULT_SECTOR];
}

export function sectorLabel(sector: string | null | undefined): string {
  return sectorVocab(sector).label;
}

export function regionLabel(region: string | null | undefined): string {
  return REGIONS[region && isRegionKey(region) ? region : DEFAULT_REGION];
}

/**
 * Regions whose research is relevant for a sprint in `region`:
 * nl → nl, eu, global · eu → eu, global · global → global.
 */
export function relevantRegions(region: string | null | undefined): RegionKey[] {
  const r = region && isRegionKey(region) ? region : DEFAULT_REGION;
  if (r === "nl") return ["nl", "eu", "global"];
  if (r === "eu") return ["eu", "global"];
  return ["global"];
}

/** Replace all {TOKEN} placeholders in a template with the sector vocabulary. */
export function applyVocab(template: string, vocab: SectorVocab): string {
  return template
    .replaceAll("{KLANTEN}", vocab.klanten)
    .replaceAll("{KLANT}", vocab.klant)
    .replaceAll("{APP}", vocab.app)
    .replaceAll("{PRODUCT}", vocab.product)
    .replaceAll("{INSTELLINGEN}", vocab.instellingen)
    .replaceAll("{INSTELLING}", vocab.instelling)
    .replaceAll("{KLOOF}", vocab.kloof)
    .replaceAll("{UITKOMSTEN}", vocab.uitkomsten)
    .replaceAll("{REALITEIT}", vocab.realiteit);
}
