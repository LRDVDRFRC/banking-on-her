// Diagnose briefing — the facilitator's prep view for the sprint day.
// English UI (internal material), rendered entirely from buildBriefing():
// deterministic, no AI calls. Prism idiom throughout (glass panels, kickers,
// rings) so it reads like the rest of the facilitator surface.

import Link from "next/link";
import { notFound } from "next/navigation";
import Ring from "@/components/Ring";
import SprintNav from "@/components/SprintNav";
import { buildBriefing } from "@/lib/briefing";
import { BAND_LEGEND } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export default async function BriefingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const briefing = await buildBriefing(id);
  if (!briefing) notFound();

  const {
    sprint,
    dimensions,
    overall,
    focus,
    divergence,
    voices,
    preworkSkipped,
    draftMandate,
    evidence,
    revealScript,
  } = briefing;
  const hasScores = overall !== null && dimensions.length > 0;
  const flagged = divergence.filter((d) => d.flagged);

  return (
    <>
      {/* ---------- Header ---------- */}
      <div className="page-label">Facilitator · Diagnose briefing</div>
      <h1 style={{ fontSize: "2.4rem", fontWeight: 700, marginBottom: 8 }}>
        {sprint.client}
      </h1>
      <p className="intro-note" style={{ marginBottom: 8 }}>
        {sprint.sectorLabel} · {sprint.regionLabel}
        {" · "}
        {sprint.date ? `Sprint day: ${sprint.date}` : "Sprint day: not set"}
        {" · "}
        {sprint.participantCount} registered · {sprint.assessmentCount}{" "}
        assessment{sprint.assessmentCount === 1 ? "" : "s"} in
      </p>
      <SprintNav sprintId={id} active="deliverables" />
      <p className="muted small" style={{ marginBottom: 36 }}>
        Internal prep document — generated from the data, nothing else.{" "}
        <Link href={`/dashboard/${id}/deliverables`}>← Back to deliverables</Link>
      </p>

      {/* ---------- The numbers ---------- */}
      <section className="glass" style={{ marginBottom: 36 }} aria-label="The numbers">
        <div className="kicker" style={{ color: "var(--sky)" }}>The numbers</div>
        <h2 style={{ fontSize: "1.6rem", marginBottom: 28 }}>
          Where the room stands today.
        </h2>
        {hasScores ? (
          <>
            <div className="results-grid">
              {dimensions.map((d) => (
                <div className="glass-sm result-card" key={d.key}>
                  <Ring pct={d.pct} label={d.label} size={92} />
                  {d.isFocus ? (
                    <span className="badge badge-sector">sprint focus</span>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="overall-wrap">
              <Ring pct={overall.pct} size={160} />
              <p className="grade-dim"><strong>Overall</strong></p>
              <p className="overall-band" style={{ color: overall.band.color }}>
                {overall.band.label}
              </p>
              <p className="overall-band-desc">{overall.band.desc}</p>
              <p className="band-legend">{BAND_LEGEND}</p>
            </div>
          </>
        ) : (
          <p className="muted">
            No assessments yet — briefing will populate as JSONs land. Pre-work,
            evidence and the draft mandate below are already usable.
          </p>
        )}
      </section>

      {/* ---------- Sprint focus ---------- */}
      <section className="glass-sm" style={{ marginBottom: 36 }} aria-label="Sprint focus">
        <div className="kicker" style={{ color: "var(--rose)" }}>Sprint focus</div>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 18 }}>
          The two lowest dimensions — where the day&rsquo;s energy goes.
        </h2>
        {focus.length === 2 ? (
          <>
            <div className="results-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 220px))" }}>
              {focus.map((d) => (
                <div className="glass-sm result-card" key={d.key}>
                  <Ring pct={d.pct} label={d.label} size={92} />
                  <span
                    className="badge"
                    style={{ background: "rgba(245,184,150,0.35)" }}
                  >
                    {d.band.label}
                  </span>
                </div>
              ))}
            </div>
            <p className="intro-note" style={{ marginTop: 8 }}>
              The room scored itself lowest on <strong>{focus[0].label}</strong>{" "}
              ({focus[0].pct}%) and <strong>{focus[1].label}</strong> (
              {focus[1].pct}%). That is where the readiness gap is widest, so
              the proposition work in the afternoon should land on these two —
              steer the mandate discussion toward them.
            </p>
          </>
        ) : (
          <p className="muted">
            The focus dimensions appear once the first assessment is in.
          </p>
        )}
      </section>

      {/* ---------- Per-dimension notes ---------- */}
      <section className="glass-sm" style={{ marginBottom: 36 }} aria-label="Per-dimension notes">
        <div className="kicker" style={{ color: "var(--amber)" }}>Per-dimension notes</div>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 18 }}>
          What each score means for how you run the day.
        </h2>
        {hasScores ? (
          dimensions.map((d) => (
            <div key={d.key} style={{ marginBottom: 22 }}>
              <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
                {d.label}{" "}
                <span style={{ color: d.band.color }}>
                  · {d.pct}% · {d.band.label}
                </span>
                {d.isFocus ? (
                  <span className="badge badge-sector" style={{ marginLeft: 10 }}>
                    sprint focus
                  </span>
                ) : null}
              </p>
              <p className="muted" style={{ marginTop: 4, lineHeight: 1.65 }}>
                {d.narrative}
              </p>
            </div>
          ))
        ) : (
          <p className="muted">
            Notes are written per band, per dimension — they appear with the
            first assessment.
          </p>
        )}
      </section>

      {/* ---------- Where the room disagrees ---------- */}
      <section className="glass-sm" style={{ marginBottom: 36 }} aria-label="Where the room disagrees">
        <div className="kicker" style={{ color: "var(--rose)" }}>Divergence</div>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 18 }}>
          Where the room disagrees.
        </h2>
        {divergence.length === 0 ? (
          <p className="muted">
            Need at least two assessments to measure divergence.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Dimension</th>
                  <th>Lowest</th>
                  <th>Highest</th>
                  <th className="num">Spread</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {divergence.map((d) => (
                  <tr key={d.key}>
                    <td>{d.label}</td>
                    <td>
                      {d.low.name} <span className="muted">({d.low.pct}%)</span>
                    </td>
                    <td>
                      {d.high.name} <span className="muted">({d.high.pct}%)</span>
                    </td>
                    <td className="num">{d.spread} pts</td>
                    <td>
                      {d.flagLine ? (
                        <span className="spread-flag">{d.flagLine}</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {flagged.length > 0 ? (
          <p className="muted small" style={{ marginTop: 14, marginBottom: 0 }}>
            {flagged.length} dimension{flagged.length === 1 ? "" : "s"} with a
            spread of 25+ points — name the people at the extremes and let them
            talk first.
          </p>
        ) : null}
      </section>

      {/* ---------- Pre-work voices ---------- */}
      <section className="glass-sm" style={{ marginBottom: 36 }} aria-label="Pre-work voices">
        <div className="kicker" style={{ color: "var(--mint)" }}>Pre-work voices</div>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 6 }}>
          &ldquo;Where is money being left on the table?&rdquo;
        </h2>
        <p className="muted small" style={{ marginBottom: 18 }}>
          Verbatim answers — pick one to read aloud at the reveal.
          {preworkSkipped > 0
            ? ` ${preworkSkipped} participant${preworkSkipped === 1 ? "" : "s"} skipped the question.`
            : ""}
        </p>
        {voices.length === 0 ? (
          <p className="muted">No pre-work answers yet.</p>
        ) : (
          voices.map((v) => (
            <div key={v.name} style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
                {v.name}
                {v.role ? (
                  <span className="muted" style={{ fontWeight: 400 }}>
                    {" "}· {v.role}
                  </span>
                ) : null}
              </p>
              <p className="prework-quote">{v.quote}</p>
            </div>
          ))
        )}
      </section>

      {/* ---------- Draft mandate ---------- */}
      <section className="glass" style={{ marginBottom: 36 }} aria-label="Draft mandate">
        <div className="kicker" style={{ color: "var(--sky)" }}>Draft mandate</div>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 14 }}>
          The opening question — in Dutch, on the wall.
        </h2>
        <p
          lang="nl"
          style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: "1.35rem",
            fontWeight: 600,
            lineHeight: 1.5,
            maxWidth: 720,
          }}
        >
          &ldquo;{draftMandate}&rdquo;
        </p>
        <p className="muted small" style={{ marginTop: 14, marginBottom: 0 }}>
          Draft — the room rewrites it during the mandate session. Its job is to
          be concrete enough to disagree with.
        </p>
      </section>

      {/* ---------- Evidence for the reveal ---------- */}
      <section className="glass-sm" style={{ marginBottom: 36 }} aria-label="Evidence for the reveal">
        <div className="kicker" style={{ color: "var(--amber)" }}>Evidence for the reveal</div>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 6 }}>
          The numbers to have on screen at 11:00.
        </h2>
        <p className="muted small" style={{ marginBottom: 18 }}>
          Top {evidence.length} matched report{evidence.length === 1 ? "" : "s"}{" "}
          for {sprint.sectorLabel} — most specific first, key stats flattened.
        </p>
        {evidence.length === 0 ? (
          <p className="muted">
            No matching reports yet — add some in the{" "}
            <Link href="/research">research library</Link>.
          </p>
        ) : (
          evidence.map((r) => (
            <div key={r.id} style={{ marginBottom: 22 }}>
              <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
                <a href={r.url} target="_blank" rel="noopener noreferrer">
                  {r.title} ↗
                </a>
              </p>
              <p className="muted small" style={{ marginBottom: 8 }}>
                {r.organization ?? "Unknown organization"}
                {r.year !== null ? ` · ${r.year}` : ""}
              </p>
              {r.keyStats.length > 0 ? (
                <div>
                  {r.keyStats.map((stat) => (
                    <span className="stat-chip" key={stat}>
                      {stat}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="muted small">No key stats captured yet.</p>
              )}
            </div>
          ))
        )}
      </section>

      {/* ---------- The 11:00 reveal script ---------- */}
      <section className="glass-sm" aria-label="The 11:00 reveal script">
        <div className="kicker" style={{ color: "var(--mint)" }}>Running the 11:00 reveal</div>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 18 }}>
          Three moves, in this order.
        </h2>
        <ol style={{ paddingLeft: 22, maxWidth: 760 }}>
          {revealScript.map((step, i) => (
            <li
              key={i}
              style={{ marginBottom: 14, lineHeight: 1.65 }}
            >
              {step}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
