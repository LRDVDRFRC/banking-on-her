import Link from "next/link";
import { addResearchReport } from "@/app/actions";
import CopyContext from "@/components/CopyContext";
import {
  allLanguages,
  allTopics,
  searchReports,
  toMarkdownDigest,
  type ResearchReport,
} from "@/lib/library";
import {
  REGIONS,
  SECTORS,
  isRegionKey,
  isSectorKey,
  regionLabel,
  sectorLabel,
} from "@/lib/sectors";

export const dynamic = "force-dynamic";

function ReportCard({ report }: { report: ResearchReport }) {
  return (
    <section className="glass-sm sprint-card" aria-label={report.title}>
      <h3>
        <Link href={`/research/${report.id}`}>{report.title}</Link>
      </h3>
      <p className="sprint-meta" style={{ marginBottom: 10 }}>
        {report.organization ?? "Unknown organization"}
        {report.year !== null ? ` · ${report.year}` : ""}
        {report.language ? ` · ${report.language.toUpperCase()}` : ""}
      </p>
      <p style={{ marginBottom: 12 }}>
        <span className="badge badge-region">{regionLabel(report.region)}</span>{" "}
        <span className="badge badge-sector">{sectorLabel(report.sector)}</span>
        {report.topics.map((t) => (
          <span key={t} className="badge"> {t}</span>
        ))}
      </p>
      <p className="muted small" style={{ marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "0.65rem" }}>
        Quick read
      </p>
      <p className="prework-quote" style={{ fontStyle: "normal" }}>{report.excerpt}</p>
      {report.keyStats.length > 0 ? (
        <p style={{ marginTop: 14, marginBottom: 0 }}>
          {report.keyStats.map((s) => (
            <span key={s} className="stat-chip">{s}</span>
          ))}
        </p>
      ) : null}
    </section>
  );
}

export default async function ResearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    sector?: string;
    region?: string;
    topic?: string;
    language?: string;
  }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() || null;
  const sectorFilter = sp.sector && isSectorKey(sp.sector) ? sp.sector : null;
  const regionFilter = sp.region && isRegionKey(sp.region) ? sp.region : null;
  const topicFilter = sp.topic?.trim() || null;
  const languageFilter = sp.language?.trim() || null;
  const hasAnyFilter = Boolean(q || sectorFilter || regionFilter || topicFilter || languageFilter);

  const [reports, topics, languages] = await Promise.all([
    searchReports({
      q: q ?? undefined,
      sector: sectorFilter ?? undefined,
      region: regionFilter ?? undefined,
      topic: topicFilter ?? undefined,
      language: languageFilter ?? undefined,
    }),
    allTopics(),
    allLanguages(),
  ]);

  const digest = toMarkdownDigest(reports, new Date());

  // Active-filter chips: each one links to the same URL minus that filter.
  const activeFilters: { key: string; label: string }[] = [];
  if (q) activeFilters.push({ key: "q", label: `“${q}”` });
  if (sectorFilter) activeFilters.push({ key: "sector", label: sectorLabel(sectorFilter) });
  if (regionFilter) activeFilters.push({ key: "region", label: regionLabel(regionFilter) });
  if (topicFilter) activeFilters.push({ key: "topic", label: topicFilter });
  if (languageFilter) activeFilters.push({ key: "language", label: languageFilter.toUpperCase() });

  const hrefWithout = (remove: string): string => {
    const params = new URLSearchParams();
    if (q && remove !== "q") params.set("q", q);
    if (sectorFilter && remove !== "sector") params.set("sector", sectorFilter);
    if (regionFilter && remove !== "region") params.set("region", regionFilter);
    if (topicFilter && remove !== "topic") params.set("topic", topicFilter);
    if (languageFilter && remove !== "language") params.set("language", languageFilter);
    const qs = params.toString();
    return qs ? `/research?${qs}` : "/research";
  };

  // Shelves (a report files under its FIRST topic only) unless the user is
  // searching or already inside a topic — then a flat result list reads better.
  const useShelves = !q && !topicFilter;
  const shelves = new Map<string, ResearchReport[]>();
  if (useShelves) {
    for (const r of reports) {
      const shelf = r.topics[0] ?? "Unfiled";
      const list = shelves.get(shelf) ?? [];
      list.push(r);
      shelves.set(shelf, list);
    }
  }
  const shelfEntries = [...shelves.entries()].sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])
  );

  return (
    <>
      <div className="page-label">Facilitator · Research library</div>
      <h1 style={{ fontSize: "2.4rem", fontWeight: 700, marginBottom: 12 }}>
        Research library
      </h1>
      <p className="intro-note" style={{ marginBottom: 16 }}>
        Evidence on the gender capital gap, by sector and region. Each card
        carries a quick read and key stats you can drop straight into a sprint
        conversation — or copy the whole result set as AI context. Sprint
        dashboards automatically surface the matching reports.
      </p>
      <p className="muted small" style={{ marginBottom: 32 }}>
        <Link href="/">← Back to sprints</Link>
        {" · "}
        <Link href="/research/ask">Ask the library →</Link>
      </p>

      {/* ---------- Search & filters ---------- */}
      <section className="glass-sm" style={{ marginBottom: 28 }} aria-label="Search and filters">
        <div className="kicker" style={{ color: "var(--sky)" }}>Search the library</div>
        <form method="get">
          <div className="field-full" style={{ marginTop: 0 }}>
            <label htmlFor="f-q">Search</label>
            <input
              id="f-q"
              name="q"
              type="search"
              defaultValue={q ?? ""}
              placeholder="e.g. pensioenkloof, widows, deeltijdwerk, $700 billion…"
            />
          </div>
          <div className="fields" style={{ marginTop: 24, gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
            <div className="field">
              <label htmlFor="f-sector">Sector</label>
              <select id="f-sector" name="sector" defaultValue={sectorFilter ?? ""}>
                <option value="">All sectors</option>
                {Object.entries(SECTORS).map(([key, v]) => (
                  <option key={key} value={key}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="f-region">Region</label>
              <select id="f-region" name="region" defaultValue={regionFilter ?? ""}>
                <option value="">All regions</option>
                {Object.entries(REGIONS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="f-topic">Topic</label>
              <select id="f-topic" name="topic" defaultValue={topicFilter ?? ""}>
                <option value="">All topics</option>
                {[...topics.entries()].map(([topic, count]) => (
                  <option key={topic} value={topic}>{topic} ({count})</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="f-language">Language</label>
              <select id="f-language" name="language" defaultValue={languageFilter ?? ""}>
                <option value="">All languages</option>
                {languages.map((lang) => (
                  <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="btn-row" style={{ marginTop: 20 }}>
            <button type="submit" className="btn btn-primary">Search</button>
            {hasAnyFilter ? (
              <Link className="btn btn-secondary" href="/research">Clear</Link>
            ) : null}
            <span className="muted small">
              {reports.length} report{reports.length === 1 ? "" : "s"}
              {hasAnyFilter ? " match" : " in the library"}
            </span>
            {reports.length > 0 ? (
              <CopyContext
                text={digest}
                label={`Copy ${reports.length} report${reports.length === 1 ? "" : "s"} as AI context`}
              />
            ) : null}
          </div>
        </form>
        {activeFilters.length > 0 ? (
          <p style={{ marginTop: 18, marginBottom: 0 }}>
            {activeFilters.map((f) => (
              <Link
                key={f.key}
                className="filter-chip"
                href={hrefWithout(f.key)}
                title={`Remove this ${f.key === "q" ? "search" : f.key} filter`}
              >
                {f.label} <span aria-hidden="true">×</span>
              </Link>
            ))}
          </p>
        ) : null}
      </section>

      {/* ---------- Results ---------- */}
      {reports.length === 0 ? (
        <p className="muted" style={{ marginBottom: 36 }}>
          No reports {hasAnyFilter ? "match this search" : "in the library yet"} —
          add one below or run <code>npm run import-research</code>.
        </p>
      ) : useShelves ? (
        shelfEntries.map(([shelf, list]) => (
          <div key={shelf}>
            <div className="shelf-head">
              <h2>{shelf}</h2>
              <span className="shelf-count">
                {list.length} report{list.length === 1 ? "" : "s"}
              </span>
            </div>
            {list.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        ))
      ) : (
        reports.map((r) => <ReportCard key={r.id} report={r} />)
      )}

      {/* ---------- Add report (collapsed by default) ---------- */}
      <details className="glass" style={{ marginTop: 36 }}>
        <summary className="kicker" style={{ color: "var(--mint)", cursor: "pointer" }}>
          Add report
        </summary>
        <form action={addResearchReport} style={{ marginTop: 16 }}>
          <div className="fields">
            <div className="field">
              <label htmlFor="title">Title</label>
              <input id="title" name="title" type="text" required placeholder="e.g. The gender pension gap in the Netherlands" />
            </div>
            <div className="field">
              <label htmlFor="organization">Organization</label>
              <input id="organization" name="organization" type="text" placeholder="e.g. Netspar" />
            </div>
          </div>
          <div className="fields" style={{ marginTop: 24, gridTemplateColumns: "2fr 1fr" }}>
            <div className="field">
              <label htmlFor="url">URL</label>
              <input id="url" name="url" type="url" required placeholder="https://…" />
            </div>
            <div className="field">
              <label htmlFor="year">Year</label>
              <input id="year" name="year" type="number" min={1990} max={2100} placeholder="2025" />
            </div>
          </div>
          <div className="fields" style={{ marginTop: 24, gridTemplateColumns: "1fr 1fr 1fr" }}>
            <div className="field">
              <label htmlFor="r-sector">Sector</label>
              <select id="r-sector" name="sector" defaultValue="algemeen">
                {Object.entries(SECTORS).map(([key, v]) => (
                  <option key={key} value={key}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="r-region">Region</label>
              <select id="r-region" name="region" defaultValue="nl">
                {Object.entries(REGIONS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="language">Language</label>
              <input id="language" name="language" type="text" placeholder="nl / en" />
            </div>
          </div>
          <div className="field-full">
            <label htmlFor="topics">Topics (comma-separated)</label>
            <input id="topics" name="topics" type="text" placeholder="pension gap, part-time work, defaults" />
          </div>
          <div className="field-full">
            <label htmlFor="excerpt">Quick read (excerpt)</label>
            <textarea
              id="excerpt"
              name="excerpt"
              required
              placeholder="2–4 sentences: the finding a facilitator can quote in the room."
            />
            <p className="field-hint">Shown on the card and on matching sprint dashboards.</p>
          </div>
          <div className="field-full">
            <label htmlFor="key_stats">Key stats (one per line, optional)</label>
            <textarea
              id="key_stats"
              name="key_stats"
              style={{ minHeight: 90 }}
              placeholder={"40% lager pensioen voor vrouwen (NL)\n€400/maand verschil"}
            />
            <p className="field-hint">
              Short quotable numbers from the report itself — shown as chips and
              fed into the AI context digest.
            </p>
          </div>
          <div className="btn-row" style={{ marginTop: 28 }}>
            <button type="submit" className="btn btn-primary">Add to library</button>
            <span className="muted small">Same URL twice updates the existing entry.</span>
          </div>
        </form>
      </details>
    </>
  );
}
