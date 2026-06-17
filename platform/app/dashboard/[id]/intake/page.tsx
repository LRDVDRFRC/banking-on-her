import Link from "next/link";
import { notFound } from "next/navigation";
import SprintNav from "@/components/SprintNav";
import DataRoom from "@/components/DataRoom";
import BenchmarkPanel from "@/components/BenchmarkPanel";
import { db, ensureSchema } from "@/lib/db";
import { formatDutchDate } from "@/lib/dates";
import { regionLabel, sectorLabel } from "@/lib/sectors";
import { DIMENSIONS, type DimensionKey } from "@/lib/scoring";

export const dynamic = "force-dynamic";

/**
 * Phase 1 — Intake. The pre-sprint gathering hub: the client intake link, who
 * has registered (with their self-scan rings), their pre-work answers, the data
 * room, and how this team benchmarks against the portfolio.
 */
export default async function IntakePage({
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
  const s = sprintRes.rows[0];
  const client = String(s.client);
  const token = String(s.token);
  const sector = s.sector == null ? "pensioen" : String(s.sector);
  const region = s.region == null ? "nl" : String(s.region);
  const sprintDate = formatDutchDate(s.sprint_date == null ? null : String(s.sprint_date));

  // Respondents: every participant with their per-dimension + overall scores
  // (LEFT JOIN — registered-but-not-scanned rows come back with null scores).
  const rowsRes = await c.execute({
    sql: `SELECT p.id, p.name, p.role, p.prework,
                 sc.mens_organisatie, sc.data, sc.marketing_communicatie,
                 sc.ecosystemen, sc.proposities, sc.overall
          FROM participants p
          LEFT JOIN assessments a ON a.participant_id = p.id
          LEFT JOIN scores sc ON sc.assessment_id = a.id
          WHERE p.sprint_id = ?
          ORDER BY p.created_at ASC`,
    args: [id],
  });
  const participants = rowsRes.rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    role: r.role == null ? null : String(r.role),
    prework: r.prework == null ? null : String(r.prework),
    overall: r.overall == null ? null : Number(r.overall),
    scores:
      r.overall == null
        ? null
        : (Object.fromEntries(
            DIMENSIONS.map((d) => [d.key, Number(r[d.key])])
          ) as Record<DimensionKey, number>),
  }));

  const withPrework = participants.filter((p) => p.prework && p.prework.trim() !== "");

  return (
    <>
      <div className="page-label">Facilitator · Phase 1 · Intake</div>
      <h1 style={{ fontSize: "2.4rem", fontWeight: 700, marginBottom: 8 }}>{client}</h1>
      <p className="intro-note" style={{ marginBottom: 8 }}>
        {sectorLabel(sector)} · {regionLabel(region)}
        {" · "}{sprintDate ? `Sprint day: ${sprintDate}` : "Sprint day: not set"}
      </p>

      <SprintNav sprintId={id} active="intake" />

      {/* ---------- Client link ---------- */}
      <section className="glass" style={{ marginBottom: 28 }} aria-label="Client intake link">
        <div className="kicker" style={{ color: "var(--sky)" }}>Client link</div>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 10 }}>The crew&rsquo;s intake page.</h2>
        <p style={{ marginBottom: 8 }}>
          <code>/s/{token}/intake</code>{" "}
          <Link href={`/s/${token}/intake`} className="muted">(open)</Link>
        </p>
        <p className="muted small" style={{ marginBottom: 0 }}>
          Share this link with the client crew — it carries the self-scan, the AI
          intake interview, the pre-work question and the document upload box.
        </p>
      </section>

      {/* ---------- Respondents ---------- */}
      <section className="glass-sm" style={{ marginBottom: 28 }} aria-label="Respondents">
        <div className="kicker" style={{ color: "var(--rose)" }}>Respondents</div>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 6 }}>Who has registered.</h2>
        <p className="muted small" style={{ marginBottom: 18 }}>
          Per-dimension self-scan and the overall readiness, by respondent.
        </p>
        {participants.length === 0 ? (
          <p className="muted" style={{ marginBottom: 0 }}>
            Nog niemand aangemeld — deel de intakelink.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  {DIMENSIONS.map((d) => (
                    <th className="num" key={d.key}>{d.label}</th>
                  ))}
                  <th className="num">Overall</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.role ?? "—"}</td>
                    {DIMENSIONS.map((d) => (
                      <td className="num" key={d.key}>
                        {p.scores ? `${p.scores[d.key]}%` : "—"}
                      </td>
                    ))}
                    <td className="num">
                      {p.overall == null ? (
                        <span className="muted">pending</span>
                      ) : (
                        <strong>{p.overall}%</strong>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---------- Pre-work ---------- */}
      <section className="glass-sm" style={{ marginBottom: 28 }} aria-label="Pre-work answers">
        <div className="kicker" style={{ color: "var(--amber)" }}>Pre-work</div>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 6 }}>
          &ldquo;Where is money being left on the table?&rdquo;
        </h2>
        <p className="muted small" style={{ marginBottom: 18 }}>
          Verbatim pre-work answers — the seed for the morning reveal.
        </p>
        {withPrework.length === 0 ? (
          <p className="muted" style={{ marginBottom: 0 }}>
            No pre-work answers yet — they appear here as the crew completes intake.
          </p>
        ) : (
          withPrework.map((p) => (
            <div key={p.id} style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
                {p.name}
                {p.role ? (
                  <span className="muted" style={{ fontWeight: 400 }}> · {p.role}</span>
                ) : null}
              </p>
              <p className="prework-quote">{p.prework}</p>
            </div>
          ))
        )}
      </section>

      {/* ---------- Data room ---------- */}
      <div style={{ marginBottom: 28 }}>
        <DataRoom sprintId={id} />
      </div>

      {/* ---------- Benchmark ---------- */}
      <BenchmarkPanel sprintId={id} />
    </>
  );
}
