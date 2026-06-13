// Research-library data access + AI-context serialisation.
// Used by /research (shelves + search), /research/[id] and /api/library so the
// humans and the machines read from exactly the same query logic.

import { db, ensureSchema } from "@/lib/db";

export interface ResearchReport {
  id: string;
  title: string;
  organization: string | null;
  year: number | null;
  url: string;
  sector: string;
  region: string;
  topics: string[];
  language: string | null;
  excerpt: string;
  keyStats: string[];
  addedAt: string | null;
}

export interface LibraryFilters {
  /** Free-text search over title, organization, topics and excerpt. */
  q?: string;
  /** Exact sector key (no relevantRegions-style widening here). */
  sector?: string;
  /** Exact region key. */
  region?: string;
  /** Exact topic (matched against the comma-separated topics list). */
  topic?: string;
  /** Exact language code. */
  language?: string;
}

function parseTopics(raw: unknown): string[] {
  if (raw == null) return [];
  return String(raw)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/** key_stats column → string[]; tolerates NULL and malformed JSON. */
function parseKeyStats(raw: unknown): string[] {
  if (raw == null) return [];
  try {
    const parsed = JSON.parse(String(raw));
    if (!Array.isArray(parsed)) return [];
    return parsed.map((s) => String(s).trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function rowToReport(r: Record<string, unknown>): ResearchReport {
  return {
    id: String(r.id),
    title: String(r.title),
    organization: r.organization == null ? null : String(r.organization),
    year: r.year == null ? null : Number(r.year),
    url: String(r.url),
    sector: String(r.sector),
    region: String(r.region),
    topics: parseTopics(r.topics),
    language: r.language == null ? null : String(r.language),
    excerpt: String(r.excerpt),
    keyStats: parseKeyStats(r.key_stats),
    addedAt: r.added_at == null ? null : String(r.added_at),
  };
}

const SELECT_COLUMNS =
  "id, title, organization, year, url, sector, region, topics, language, excerpt, key_stats, added_at";

/** Filtered library query, newest first. Empty filters → the whole library. */
export async function searchReports(filters: LibraryFilters = {}): Promise<ResearchReport[]> {
  await ensureSchema();

  const where: string[] = [];
  const args: string[] = [];

  const q = filters.q?.trim();
  if (q) {
    where.push("(title LIKE ? OR organization LIKE ? OR topics LIKE ? OR excerpt LIKE ?)");
    const like = `%${q}%`;
    args.push(like, like, like, like);
  }
  if (filters.sector?.trim()) {
    where.push("sector = ?");
    args.push(filters.sector.trim());
  }
  if (filters.region?.trim()) {
    where.push("region = ?");
    args.push(filters.region.trim());
  }
  if (filters.topic?.trim()) {
    // topics is stored "a, b, c" — normalise to ",a,b,c," and match the exact item.
    where.push("(',' || REPLACE(IFNULL(topics, ''), ', ', ',') || ',') LIKE ?");
    args.push(`%,${filters.topic.trim()},%`);
  }
  if (filters.language?.trim()) {
    where.push("language = ?");
    args.push(filters.language.trim());
  }

  const res = await db().execute({
    sql: `SELECT ${SELECT_COLUMNS}
          FROM research_reports
          ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
          ORDER BY year DESC, title ASC`,
    args,
  });
  return res.rows.map((r) => rowToReport(r as unknown as Record<string, unknown>));
}

/** topic → number of reports carrying it, sorted by count desc then A–Z. */
export async function allTopics(): Promise<Map<string, number>> {
  await ensureSchema();
  const res = await db().execute("SELECT topics FROM research_reports");
  const counts = new Map<string, number>();
  for (const row of res.rows) {
    for (const topic of parseTopics(row.topics)) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }
  return new Map(
    [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  );
}

/** Distinct language codes in the library (for the language facet). */
export async function allLanguages(): Promise<string[]> {
  await ensureSchema();
  const res = await db().execute(
    "SELECT DISTINCT language FROM research_reports WHERE language IS NOT NULL ORDER BY language"
  );
  return res.rows.map((r) => String(r.language)).filter(Boolean);
}

export async function getReport(id: string): Promise<ResearchReport | null> {
  await ensureSchema();
  const res = await db().execute({
    sql: `SELECT ${SELECT_COLUMNS} FROM research_reports WHERE id = ?`,
    args: [id],
  });
  if (res.rows.length === 0) return null;
  return rowToReport(res.rows[0] as unknown as Record<string, unknown>);
}

/**
 * Compact, LLM-ready markdown digest of a set of reports — terse on purpose:
 * this is pasted into an AI context window, not read by humans. The caller
 * supplies the generation timestamp so the function itself stays pure.
 */
export function toMarkdownDigest(
  reports: ResearchReport[],
  generatedAt: Date = new Date()
): string {
  const lines: string[] = [
    `Unlockt research library digest — ${reports.length} report${reports.length === 1 ? "" : "s"} — generated ${generatedAt.toISOString()}`,
  ];
  for (const r of reports) {
    const head = [
      `## ${r.title}`,
      r.organization ? ` — ${r.organization}` : "",
      r.year !== null ? `, ${r.year}` : "",
      ` [${r.sector}/${r.region}]`,
    ].join("");
    lines.push("", head);
    if (r.keyStats.length > 0) lines.push(`Key stats: ${r.keyStats.join("; ")}`);
    lines.push(`Quick read: ${r.excerpt}`, `Source: ${r.url}`);
  }
  return lines.join("\n");
}
