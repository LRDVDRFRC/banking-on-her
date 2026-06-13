import Link from "next/link";
import { notFound } from "next/navigation";
import ReadoutTrigger from "@/components/ReadoutTrigger";
import type { ReadoutAverages, ReadoutDoc } from "@/lib/readout";
import { db, ensureSchema } from "@/lib/db";
import { sectorLabel, regionLabel } from "@/lib/sectors";

export const dynamic = "force-dynamic";

// Same print treatment as the findings page (kept local on purpose — these
// facilitator pages each carry their own copy).
const PRINT_CSS = `
@media print {
  body { background: #fff !important; }
  .site-header, .site-footer, .no-print, .btn, button { display: none !important; }
  .page { padding: 0 !important; max-width: none !important; }
  .glass, .glass-sm {
    background: #fff !important;
    box-shadow: none !important;
    border: 1px solid #ddd !important;
    break-inside: avoid;
  }
  .glass::before, .glass-sm::before { display: none !important; }
  a { color: inherit !important; text-decoration: none !important; }
}
`;

function parseReadout(raw: unknown): ReadoutDoc | null {
  if (raw == null) return null;
  try {
    const doc = JSON.parse(String(raw)) as ReadoutDoc;
    if (!doc || !Array.isArray(doc.ranking) || !doc.aanbeveling) return null;
    return doc;
  } catch {
    return null;
  }
}

const SCORE_LABELS: { key: keyof ReadoutAverages; label: string }[] = [
  { key: "gebruiken", label: "Zou ik gebruiken" },
  { key: "begrijpen", label: "Begrijp ik meteen" },
  { key: "vertrouwen", label: "Vertrouw ik" },
];

/** "4.2 / 5" with a small label — honest about a 1–5 scale (rings imply %). */
function ScoreTriple({ gemiddelden }: { gemiddelden: ReadoutAverages }) {
  return (
    <div style={{ display: "flex", gap: 28, flexWrap: "wrap", margin: "14px 0 6px" }}>
      {SCORE_LABELS.map(({ key, label }) => (
        <div key={key}>
          <p
            style={{
              fontFamily: "'Sora', sans-serif",
              fontWeight: 700,
              fontSize: "1.45rem",
              marginBottom: 2,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {gemiddelden[key].toFixed(1)}
            <span className="muted" style={{ fontSize: "0.85rem", fontWeight: 600 }}> / 5</span>
          </p>
          <p className="muted small" style={{ marginBottom: 0 }}>&ldquo;{label}&rdquo;</p>
        </div>
      ))}
    </div>
  );
}

export default async function ReadoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await ensureSchema();
  const c = db();

  const sprintRes = await c.execute({
    sql: `SELECT id, client, sector, region, readout_json, readout_at
          FROM sprints WHERE id = ?`,
    args: [id],
  });
  if (sprintRes.rows.length === 0) notFound();
  const sprint = sprintRes.rows[0];
  const client = String(sprint.client);
  const sector = sprint.sector == null ? "pensioen" : String(sprint.sector);
  const region = sprint.region == null ? "nl" : String(sprint.region);
  const readout = parseReadout(sprint.readout_json);
  const readoutAt = sprint.readout_at == null ? null : String(sprint.readout_at);
  const aiEnabled = Boolean(process.env.ANTHROPIC_API_KEY);

  // How much Phase 6 produced — drives the empty state.
  const feedbackRes = await c.execute({
    sql: "SELECT count(*) AS n FROM feedback WHERE sprint_id = ?",
    args: [id],
  });
  const feedbackCount = Number(feedbackRes.rows[0].n);
  const chosenRes = await c.execute({
    sql: "SELECT count(*) AS n FROM concepts WHERE sprint_id = ? AND chosen = 1",
    args: [id],
  });
  const chosenCount = Number(chosenRes.rows[0].n);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <div className="page-label">Facilitator · The readout — Phase 7</div>
      <h1 style={{ fontSize: "2.4rem", fontWeight: 700, marginBottom: 8 }}>
        The morning after. {client}.
      </h1>
      <p className="intro-note" style={{ marginBottom: 8 }}>
        {sectorLabel(sector)} · {regionLabel(region)} · what the panel said, ranked — and the pilot call.
      </p>
      <p className="muted small no-print" style={{ marginBottom: 28 }}>
        <Link href={`/dashboard/${id}`} className="muted">← Back to dashboard</Link>
        {" · "}
        <Link href={`/dashboard/${id}/canvas`} className="muted">Ideation canvas</Link>
        {feedbackCount > 0 ? ` · ${feedbackCount} panel reactions captured` : ""}
        {" · print this page or save as PDF for the decision meeting"}
      </p>

      <ReadoutTrigger
        sprintId={id}
        hasReadout={readout !== null}
        readoutAt={readoutAt}
        enabled={aiEnabled}
      />

      {readout ? (
        <>
          {/* ---- lead ---- */}
          <section className="glass" style={{ marginBottom: 28 }} aria-label="Summary">
            <div className="kicker" style={{ color: "var(--sky)" }}>The evening in four sentences</div>
            <p style={{ fontSize: "1.08rem", lineHeight: 1.8, marginBottom: 0 }}>
              {readout.samenvatting}
            </p>
          </section>

          {/* ---- ranking ---- */}
          {readout.ranking.map((entry, i) => (
            <section
              className="glass-sm"
              style={{ marginBottom: 24 }}
              key={entry.conceptId}
              aria-label={`Rank ${i + 1}: ${entry.title}`}
            >
              <div style={{ display: "flex", gap: 18, alignItems: "baseline", flexWrap: "wrap" }}>
                <span
                  aria-hidden="true"
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    fontWeight: 700,
                    fontSize: "1.9rem",
                    color: i === 0 ? "var(--ink)" : "rgba(13,59,46,0.35)",
                    lineHeight: 1,
                  }}
                >
                  #{i + 1}
                </span>
                <div>
                  <h2 style={{ fontSize: "1.35rem", marginBottom: 2 }}>{entry.title}</h2>
                </div>
              </div>

              <ScoreTriple gemiddelden={entry.gemiddelden} />

              <p style={{ lineHeight: 1.7, margin: "12px 0 18px", fontStyle: "italic" }}>
                {entry.verdict}
              </p>

              {entry.resoneerde.length > 0 ? (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "0.92rem", marginBottom: 8 }}>
                    Wat resoneerde
                  </p>
                  {entry.resoneerde.map((q, j) => (
                    <p className="prework-quote" key={j} style={{ marginBottom: 10 }}>
                      {q}
                    </p>
                  ))}
                </div>
              ) : null}

              {entry.schuurde.length > 0 ? (
                <div>
                  <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "0.92rem", marginBottom: 8 }}>
                    Wat schuurde
                  </p>
                  {entry.schuurde.map((q, j) => (
                    <p
                      className="prework-quote"
                      key={j}
                      style={{ marginBottom: 10, borderLeftColor: "var(--rose)" }}
                    >
                      {q}
                    </p>
                  ))}
                </div>
              ) : null}
            </section>
          ))}

          {/* ---- recommendation ---- */}
          <section
            className="glass"
            style={{ marginBottom: 28, borderLeft: "5px solid var(--mint)" }}
            aria-label="Recommendation"
          >
            <div className="kicker" style={{ color: "var(--mint)" }}>The recommendation</div>
            <h2 style={{ fontSize: "1.5rem", marginBottom: 12 }}>
              Pilot &ldquo;{readout.aanbeveling.title}&rdquo;.
            </h2>
            <p style={{ fontSize: "1.05rem", lineHeight: 1.8, marginBottom: 18 }}>
              {readout.aanbeveling.rationale}
            </p>
            {readout.aanbeveling.voorwaarden.length > 0 ? (
              <>
                <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "0.92rem", marginBottom: 8 }}>
                  Before piloting, fix:
                </p>
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {readout.aanbeveling.voorwaarden.map((v, j) => (
                    <li
                      key={j}
                      style={{
                        display: "flex",
                        gap: 12,
                        padding: "8px 0",
                        borderBottom: "1px solid rgba(13,59,46,0.08)",
                        lineHeight: 1.6,
                      }}
                    >
                      <span aria-hidden="true" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>☐</span>
                      <span>{v}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>
        </>
      ) : (
        <section className="glass" aria-label="Not synthesized yet">
          <div className="kicker" style={{ color: "var(--amber)" }}>Not synthesized yet</div>
          {feedbackCount > 0 ? (
            <p style={{ marginBottom: 0 }}>
              {feedbackCount} panel reaction{feedbackCount === 1 ? "" : "s"} captured — hit{" "}
              <strong>Synthesize readout</strong> above and the AI writes the
              ranking, what resonated, what fell flat, and the pilot
              recommendation into this page.
            </p>
          ) : (
            <p style={{ marginBottom: 0 }}>
              The readout synthesizes <strong>Phase 6</strong> — the 18:00–21:00
              evening panel where 6–8 women from the target group rotate along
              the prototype stations. {chosenCount > 0
                ? `The ${chosenCount} chosen concept${chosenCount === 1 ? "" : "s"} are ready; the`
                : "First pick 3–5 concepts on the ideation canvas and build their prototypes — then the"}{" "}
              panel host captures every reaction (three scores, verbatim quotes,
              observations) on the test stations. Once at least one reaction is
              in, synthesize the readout here the next morning.
            </p>
          )}
        </section>
      )}
    </>
  );
}
