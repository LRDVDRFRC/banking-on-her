// Phase-4 ideation canvas axes: the moment × mechanism grid.
// Moments are sector-aware life events (DUTCH labels — they face the client
// room); mechanisms are the five shared intervention types. Every concept
// occupies exactly one (moment, mechanism) cell, and the diversity rule wants
// the chosen 3–5 concepts spread across DIFFERENT cells — five variants of one
// idea test as one idea in the evening panel.

import { DEFAULT_SECTOR, isSectorKey, type SectorKey } from "@/lib/sectors";

export interface AxisItem {
  key: string;
  label: string;
}

// Six life-event moments per sector. Keys are stable slugs (stored in the
// concepts table); labels are the Dutch room-facing names.
const MOMENTS: Record<SectorKey, AxisItem[]> = {
  pensioen: [
    { key: "urenwijziging", label: "Urenwijziging" },
    { key: "geboorte-verlof", label: "Geboorte & verlof" },
    { key: "scheiding", label: "Scheiding" },
    { key: "baanwissel", label: "Baanwissel" },
    { key: "pensioen-in-zicht", label: "Pensioen in zicht" },
    { key: "overlijden-partner", label: "Overlijden partner" },
  ],
  bank: [
    { key: "eerste-inkomen", label: "Eerste inkomen" },
    { key: "samenwonen-trouwen", label: "Samenwonen & trouwen" },
    { key: "geboorte", label: "Geboorte" },
    { key: "scheiding", label: "Scheiding" },
    { key: "erfenis", label: "Erfenis" },
    { key: "ondernemen", label: "Ondernemen" },
  ],
  verzekeraar: [
    { key: "eerste-baan", label: "Eerste baan" },
    { key: "samenwonen-trouwen", label: "Samenwonen & trouwen" },
    { key: "geboorte-verlof", label: "Geboorte & verlof" },
    { key: "scheiding", label: "Scheiding" },
    { key: "arbeidsongeschiktheid", label: "Arbeidsongeschiktheid" },
    { key: "overlijden-partner", label: "Overlijden partner" },
  ],
  vermogensbeheer: [
    { key: "eerste-vermogen", label: "Eerste vermogen" },
    { key: "urenwijziging", label: "Urenwijziging" },
    { key: "erfenis", label: "Erfenis" },
    { key: "scheiding", label: "Scheiding" },
    { key: "verkoop-bedrijf", label: "Verkoop bedrijf" },
    { key: "pensioen-in-zicht", label: "Pensioen in zicht" },
  ],
  hypotheek: [
    { key: "eerste-koopwoning", label: "Eerste koopwoning" },
    { key: "samenwonen-trouwen", label: "Samenwonen & trouwen" },
    { key: "geboorte-verlof", label: "Geboorte & verlof" },
    { key: "urenwijziging", label: "Urenwijziging" },
    { key: "scheiding", label: "Scheiding" },
    { key: "einde-rentevast", label: "Einde rentevaste periode" },
  ],
  algemeen: [
    { key: "eerste-inkomen", label: "Eerste inkomen" },
    { key: "samenwonen-trouwen", label: "Samenwonen & trouwen" },
    { key: "geboorte-verlof", label: "Geboorte & verlof" },
    { key: "urenwijziging", label: "Urenwijziging" },
    { key: "scheiding", label: "Scheiding" },
    { key: "pensioen-in-zicht", label: "Pensioen in zicht" },
  ],
};

// The five intervention mechanisms — shared across all sectors (Dutch).
export const MECHANISMS: AxisItem[] = [
  { key: "product", label: "Product" },
  { key: "communicatie", label: "Communicatie" },
  { key: "default", label: "Standaardinstelling (default)" },
  { key: "service", label: "Service & begeleiding" },
  { key: "kanaal", label: "Kanaal & ecosysteem" },
];

/** The six moment rows for a sector, falling back to the default (pensioen). */
export function momentsFor(sectorKey: string | null | undefined): AxisItem[] {
  return MOMENTS[sectorKey && isSectorKey(sectorKey) ? sectorKey : DEFAULT_SECTOR];
}

export function isMomentKey(sectorKey: string | null | undefined, key: string): boolean {
  return momentsFor(sectorKey).some((m) => m.key === key);
}

export function isMechanismKey(key: string): boolean {
  return MECHANISMS.some((m) => m.key === key);
}

export function momentLabel(sectorKey: string | null | undefined, key: string): string {
  return momentsFor(sectorKey).find((m) => m.key === key)?.label ?? key;
}

export function mechanismLabel(key: string): string {
  return MECHANISMS.find((m) => m.key === key)?.label ?? key;
}
