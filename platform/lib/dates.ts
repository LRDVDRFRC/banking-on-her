const MONTHS_NL = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

/** "2026-06-26" → "26 juni 2026". Non-ISO strings pass through; empty → null. */
export function formatDutchDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const trimmed = iso.trim();
  if (!trimmed) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!m) return trimmed;
  const monthIndex = Number(m[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return trimmed;
  return `${Number(m[3])} ${MONTHS_NL[monthIndex]} ${m[1]}`;
}
