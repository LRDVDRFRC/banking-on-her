import Link from "next/link";
import { notFound } from "next/navigation";
import SprintNav from "@/components/SprintNav";
import { db, ensureSchema } from "@/lib/db";
import { formatDutchDate } from "@/lib/dates";
import { mechanismLabel, momentLabel } from "@/lib/moments";
import { regionLabel, sectorLabel } from "@/lib/sectors";

export const dynamic = "force-dynamic";

/**
 * Phase 5 — Prototypes. The chosen 3–5 concepts and whether each has been built
 * into a testable package. Each card links into its build pod.
 */
export default async function PrototypesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await ensureSchema();
  const c = db();

  const sprintRes = await c.execute({
    sql: "SELECT id, client, sprint_date, sector, region FROM sprints WHERE id = ?",
    args: [id],
  });
  if (sprintRes.rows.length === 0) notFound();
  const s = sprintRes.rows[0];
  const client = String(s.client);
  const sector = s.sector == null ? "pensioen" : String(s.sector);
  const region = s.region == null ? "nl" : String(s.region);
  const sprintDate = formatDutchDate(s.sprint_date == null ? null : String(s.sprint_date));

  const conceptsRes = await c.execute({
    sql: `SELECT id, title, moment, mechanism, prototype_json
          FROM concepts WHERE sprint_id = ? AND chosen = 1
          ORDER BY created_at ASC, id ASC`,
    args: [id],
  });
  const concepts = conceptsRes.rows.map((r) => ({
    id: String(r.id),
    title: String(r.title),
    moment: String(r.moment),
    mechanism: String(r.mechanism),
    built: r.prototype_json != null,
  }));

  return (
    <>
      <div className="page-label">Facilitator · Phase 5 · Prototypes</div>
      <h1 style={{ fontSize: "2.4rem", fontWeight: 700, marginBottom: 8 }}>{client}</h1>
      <p className="intro-note" style={{ marginBottom: 8 }}>
        {sectorLabel(sector)} · {regionLabel(region)}
        {" · "}{sprintDate ? `Sprint day: ${sprintDate}` : "Sprint day: not set"}
      </p>

      <SprintNav sprintId={id} active="prototypes" />

      <p style={{ maxWidth: 760, lineHeight: 1.7, marginBottom: 28 }}>
        Phase 5 · 14:00 — build the chosen concepts into testable prototypes.
      </p>

      {concepts.length === 0 ? (
        <section className="glass" aria-label="No chosen concepts">
          <div className="kicker" style={{ color: "var(--amber)" }}>Nothing chosen yet</div>
          <p style={{ marginBottom: 0 }}>
            Choose 3–5 concepts on the{" "}
            <Link href={`/dashboard/${id}/canvas`}>ideation canvas</Link> first —
            they appear here as build pods.
          </p>
        </section>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {concepts.map((concept) => (
            <section
              className="glass-sm"
              key={concept.id}
              aria-label={concept.title}
              style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}
            >
              <div style={{ flex: "1 1 320px" }}>
                <h2 style={{ fontSize: "1.3rem", marginBottom: 4 }}>{concept.title}</h2>
                <p className="muted small" style={{ marginBottom: 8 }}>
                  {momentLabel(sector, concept.moment)} × {mechanismLabel(concept.mechanism)}
                </p>
                <span
                  className="stat-chip"
                  style={{
                    background: concept.built
                      ? "rgba(159,212,176,0.35)"
                      : "rgba(242,208,128,0.3)",
                  }}
                >
                  {concept.built ? "prototype built ✓" : "not built yet"}
                </span>
              </div>
              <Link
                className="btn btn-secondary"
                href={`/dashboard/${id}/concepts/${concept.id}`}
              >
                {concept.built ? "Open build pod →" : "Build prototype →"}
              </Link>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
