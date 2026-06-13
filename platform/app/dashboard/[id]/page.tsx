import Link from "next/link";
import { notFound } from "next/navigation";
import Ring from "@/components/Ring";
import BenchmarkPanel from "@/components/BenchmarkPanel";
import DataRoom from "@/components/DataRoom";
import { db, ensureSchema } from "@/lib/db";
import { formatDutchDate } from "@/lib/dates";
import {
  regionLabel,
  relevantRegions,
  sectorLabel,
} from "@/lib/sectors";
import {
  BAND_LEGEND,
  DIMENSIONS,
  bandFor,
  mergePcts,
  overallPct,
  type DimensionKey,
} from "@/lib/scoring";

export const dynamic = "force-dynamic";

interface RespondentRow {
  id: string;
  name: string;
  role: string | null;
  prework: string | null;
  scores: Record<DimensionKey, number> | null;
  overall: number | null;
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await ensureSchema();
  const c = db();

  const sprintRes = await c.execute({
    sql: "SELECT id, client, sprint_date, token, sector, region FROM sprints WHERE id = ?",
    args: [id],
  });
  if (sprintRes.rows.length === 0) notFound();
  const sprint = sprintRes.rows[0];
  const client = String(sprint.client);
  const token = String(sprint.token);
  const sector = sprint.sector == null ? "pensioen" : String(sprint.sector);
  const region = sprint.region == null ? "nl" : String(sprint.region);
  const sprintDate = formatDutchDate(
    sprint.sprint_date == null ? null : String(sprint.sprint_date)
  );

  // Relevant research: the sprint's sector plus cross-sector ('algemeen'),
  // in regions that apply to the sprint region; exact-region matches first.
  const regions = relevantRegions(region);
  const researchRes = await c.execute({
    sql: `SELECT id, title, organization, year, url, excerpt
          FROM research_reports
          WHERE sector IN (?, 'algemeen')
            AND region IN (${regions.map(() => "?").join(", ")})
          ORDER BY CASE WHEN region = ? THEN 0 ELSE 1 END, year DESC, title ASC`,
    args: [sector, ...regions, region],
  });
  const research = researchRes.rows.map((r) => ({
    id: String(r.id),
    title: String(r.title),
    organization: r.organization == null ? null : String(r.organization),
    year: r.year == null ? null : Number(r.year),
    url: String(r.url),
    excerpt: String(r.excerpt),
  }));

  const rowsRes = await c.execute({
    sql: `SELECT p.id, p.name, p.role, p.prework,
                 s.mens_organisatie, s.data, s.marketing_communicatie,
                 s.ecosystemen, s.proposities, s.overall
          FROM participants p
          LEFT JOIN assessments a ON a.participant_id = p.id
          LEFT JOIN scores s ON s.assessment_id = a.id
          WHERE p.sprint_id = ?
          ORDER BY p.created_at ASC`,
    args: [id],
  });

  const respondents: RespondentRow[] = rowsRes.rows.map((r) => {
    const hasScores = r.overall != null;
    const scores = hasScores
      ? (Object.fromEntries(
          DIMENSIONS.map((d) => [d.key, Number(r[d.key])])
        ) as Record<DimensionKey, number>)
      : null;
    return {
      id: String(r.id),
      name: String(r.name),
      role: r.role == null ? null : String(r.role),
      prework: r.prework == null ? null : String(r.prework),
      scores,
      overall: hasScores ? Number(r.overall) : null,
    };
  });

  const scored = respondents.filter(
    (r): r is RespondentRow & { scores: Record<DimensionKey, number> } =>
      r.scores !== null
  );

  const merged =
    scored.length > 0
      ? (Object.fromEntries(
          DIMENSIONS.map((d) => [
            d.key,
            mergePcts(scored.map((r) => r.scores[d.key])),
          ])
        ) as Record<DimensionKey, number>)
      : null;
  const mergedOverall = merged
    ? overallPct(DIMENSIONS.map((d) => merged[d.key]))
    : null;
  const mergedBand = mergedOverall === null ? null : bandFor(mergedOverall);

  const divergence = DIMENSIONS.map((d) => {
    const values = scored.map((r) => r.scores[d.key]);
    if (values.length === 0) return { dim: d, min: null, max: null, spread: null };
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { dim: d, min, max, spread: max - min };
  });

  return (
    <>
      <div className="page-label">Facilitator · Sprint dashboard</div>
      <h1 style={{ fontSize: "2.4rem", fontWeight: 700, marginBottom: 8 }}>{client}</h1>
      <p className="intro-note" style={{ marginBottom: 8 }}>
        {sectorLabel(sector)} · {regionLabel(region)}
        {" · "}
        {sprintDate ? `Sprint day: ${sprintDate}` : "Sprint day: not set"}
        {" · "}
        {respondents.length} registered · {scored.length} assessment{scored.length === 1 ? "" : "s"} in
      </p>
      <p className="muted small" style={{ marginBottom: 36 }}>
        Client intake link: <code>/s/{token}/intake</code>{" "}
        <Link href={`/s/${token}/intake`} className="muted">(open)</Link>
      </p>

      {/* ---------- Merged readiness ---------- */}
      <section className="glass" style={{ marginBottom: 36 }} aria-label="Merged readiness">
        <div className="kicker" style={{ color: "var(--sky)" }}>Merged readiness</div>
        <h2 style={{ fontSize: "1.6rem", marginBottom: 28 }}>
          The room&rsquo;s combined picture.
        </h2>
        {merged && mergedOverall !== null && mergedBand ? (
          <>
            <div className="results-grid">
              {DIMENSIONS.map((dim) => (
                <div className="glass-sm result-card" key={dim.key}>
                  <Ring pct={merged[dim.key]} label={dim.label} size={92} />
                </div>
              ))}
            </div>
            <div className="overall-wrap">
              <Ring pct={mergedOverall} size={160} />
              <p className="grade-dim"><strong>Overall</strong></p>
              <p className="overall-band" style={{ color: mergedBand.color }}>
                {mergedBand.label}
              </p>
              <p className="overall-band-desc">{mergedBand.desc}</p>
              <p className="band-legend">{BAND_LEGEND}</p>
            </div>
          </>
        ) : (
          <p className="muted">No assessments in yet — rings appear as soon as the first one lands.</p>
        )}
      </section>

      {/* ---------- Divergence ---------- */}
      <section className="glass-sm" style={{ marginBottom: 36 }} aria-label="Divergence">
        <div className="kicker" style={{ color: "var(--rose)" }}>Divergence</div>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 18 }}>
          Where the answers disagree.
        </h2>
        {scored.length < 2 ? (
          <p className="muted">
            Need at least two assessments to measure divergence.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Dimension</th>
                  <th className="num">Min</th>
                  <th className="num">Max</th>
                  <th className="num">Spread</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {divergence.map(({ dim, min, max, spread }) => (
                  <tr key={dim.key}>
                    <td>{dim.label}</td>
                    <td className="num">{min}%</td>
                    <td className="num">{max}%</td>
                    <td className="num">{spread} pts</td>
                    <td>
                      {spread !== null && spread >= 25 ? (
                        <span className="spread-flag">
                          the room disagrees here — that&rsquo;s where the conversation is
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---------- Respondents ---------- */}
      <section className="glass-sm" style={{ marginBottom: 36 }} aria-label="Respondents">
        <div className="kicker" style={{ color: "var(--amber)" }}>Respondents</div>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 18 }}>
          Per-person readiness.
        </h2>
        {respondents.length === 0 ? (
          <p className="muted">No one has registered yet — share the intake link.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  {DIMENSIONS.map((d) => (
                    <th className="num" key={d.key} title={d.label}>
                      {d.label.length > 14 ? `${d.label.slice(0, 13)}…` : d.label}
                    </th>
                  ))}
                  <th className="num">Overall</th>
                </tr>
              </thead>
              <tbody>
                {respondents.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td className="muted">{r.role ?? "—"}</td>
                    {DIMENSIONS.map((d) => (
                      <td className="num" key={d.key}>
                        {r.scores ? `${r.scores[d.key]}%` : "—"}
                      </td>
                    ))}
                    <td className="num">
                      {r.overall !== null ? `${r.overall}%` : "pending"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---------- Pre-work ---------- */}
      <section className="glass-sm" style={{ marginBottom: 36 }} aria-label="Pre-work">
        <div className="kicker" style={{ color: "var(--mint)" }}>Pre-work</div>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 6 }}>
          &ldquo;Where is money being left on the table?&rdquo;
        </h2>
        <p className="muted small" style={{ marginBottom: 18 }}>
          Verbatim answers — read these out loud at the start of the sprint day.
        </p>
        {respondents.length === 0 ? (
          <p className="muted">No answers yet.</p>
        ) : (
          respondents.map((r) => (
            <div key={r.id} style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
                {r.name}
                {r.role ? <span className="muted" style={{ fontWeight: 400 }}> · {r.role}</span> : null}
              </p>
              {r.prework ? (
                <p className="prework-quote">{r.prework}</p>
              ) : (
                <p className="muted small" style={{ marginTop: 4 }}>No pre-work answer given.</p>
              )}
            </div>
          ))
        )}
      </section>

      {/* ---------- Relevant research ---------- */}
      <section className="glass-sm" style={{ marginBottom: 36 }} aria-label="Relevant research">
        <div className="kicker" style={{ color: "var(--sky)" }}>Relevant research</div>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 6 }}>
          Evidence for this sprint.
        </h2>
        <p className="muted small" style={{ marginBottom: 18 }}>
          Reports matching {sectorLabel(sector)} (+ cross-sector) in{" "}
          {regions.map((r) => regionLabel(r)).join(" / ")} — most specific first.
        </p>
        {research.length === 0 ? (
          <p className="muted">
            No matching reports yet — add some in the{" "}
            <Link href="/research">research library</Link>.
          </p>
        ) : (
          <>
            {research.map((r) => (
              <div key={r.id} style={{ marginBottom: 22 }}>
                <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer">
                    {r.title} ↗
                  </a>
                </p>
                <p className="muted small">
                  {r.organization ?? "Unknown organization"}
                  {r.year !== null ? ` · ${r.year}` : ""}
                </p>
                <details className="quick-read">
                  <summary>Quick read</summary>
                  <p className="prework-quote" style={{ fontStyle: "normal" }}>{r.excerpt}</p>
                </details>
              </div>
            ))}
            <p className="muted small" style={{ marginTop: 4, marginBottom: 0 }}>
              Browse the full <Link href="/research">research library</Link>.
            </p>
          </>
        )}
      </section>

      {/* ---------- Data room ---------- */}
      <DataRoom sprintId={id} />

      {/* ---------- Export ---------- */}
      <section className="glass-sm" aria-label="Export">
        <div className="kicker" style={{ color: "var(--sky)" }}>Deck handoff</div>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 18 }}>
          Export sprint-data JSON.
        </h2>
        <div className="btn-row">
          <a className="btn btn-primary" href={`/dashboard/${id}/findings`}>
            Findings — the Phase 1 mirror →
          </a>
          <a className="btn btn-primary" href={`/dashboard/${id}/canvas`}>
            Ideation canvas — Phase 4 →
          </a>
          <a className="btn btn-primary" href={`/dashboard/${id}/readout`}>
            Readout — the morning after →
          </a>
        </div>
        <div className="btn-row" style={{ marginTop: 10 }}>
          <a className="btn" href={`/dashboard/${id}/deck`} target="_blank">
            Generate deck →
          </a>
          <a className="btn" href={`/dashboard/${id}/briefing`}>
            Diagnose briefing
          </a>
          <a className="btn" href={`/dashboard/${id}/dossier`} target="_blank">
            Evidence dossier →
          </a>
          <a className="btn" href={`/dashboard/${id}/export`}>
            Export sprint-data JSON
          </a>
        </div>
        <p className="muted small" style={{ marginTop: 12, marginBottom: 0 }}>
          Top row follows the sprint day: the morning mirror, the 12:30 canvas
          (concepts → prototypes → evening test stations), and the
          next-morning readout. Below: the deck, the facilitator briefing, the
          client-facing dossier and the raw JSON export.
        </p>
        <p className="muted small" style={{ marginTop: 18, marginBottom: 0 }}>
          Then fill the proposition deck:
        </p>
        <code className="codeblock">
          node ../sprint/08_fill-deck.js sprint-data-{id}.json filled-deck.html
        </code>
      </section>

      {/* ---------- Benchmark ---------- */}
      <BenchmarkPanel sprintId={id} />
    </>
  );
}
