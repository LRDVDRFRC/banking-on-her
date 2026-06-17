import Link from "next/link";
import { notFound } from "next/navigation";
import SprintNav from "@/components/SprintNav";
import { db, ensureSchema } from "@/lib/db";
import { formatDutchDate } from "@/lib/dates";
import { mechanismLabel, momentLabel } from "@/lib/moments";
import { regionLabel, sectorLabel } from "@/lib/sectors";

export const dynamic = "force-dynamic";

/**
 * Phase 6 — Test. The evening-panel hub: per chosen concept, the client
 * test-view link and how many reactions it has gathered, plus the totals.
 */
export default async function TestPage({
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

  // Chosen concepts with a per-concept feedback count.
  const conceptsRes = await c.execute({
    sql: `SELECT k.id, k.title, k.moment, k.mechanism,
                 (SELECT count(*) FROM feedback f WHERE f.concept_id = k.id) AS reactions
          FROM concepts k
          WHERE k.sprint_id = ? AND k.chosen = 1
          ORDER BY k.created_at ASC, k.id ASC`,
    args: [id],
  });
  const concepts = conceptsRes.rows.map((r) => ({
    id: String(r.id),
    title: String(r.title),
    moment: String(r.moment),
    mechanism: String(r.mechanism),
    reactions: Number(r.reactions),
  }));

  // Totals across the panel.
  const totalsRes = await c.execute({
    sql: `SELECT count(*) AS rows, count(DISTINCT panelist) AS panelists
          FROM feedback WHERE sprint_id = ?`,
    args: [id],
  });
  const totalRows = Number(totalsRes.rows[0].rows);
  const panelists = Number(totalsRes.rows[0].panelists);

  return (
    <>
      <div className="page-label">Facilitator · Phase 6 · Test</div>
      <h1 style={{ fontSize: "2.4rem", fontWeight: 700, marginBottom: 8 }}>{client}</h1>
      <p className="intro-note" style={{ marginBottom: 8 }}>
        {sectorLabel(sector)} · {regionLabel(region)}
        {" · "}{sprintDate ? `Sprint day: ${sprintDate}` : "Sprint day: not set"}
      </p>

      <SprintNav sprintId={id} active="test" />

      <p style={{ maxWidth: 760, lineHeight: 1.7, marginBottom: 28 }}>
        Phase 6 · het avondpanel draait van 18:00 tot 21:00 — 6–8 vrouwen uit de
        doelgroep testen de prototypes op een tablet en geven hun oordeel.
      </p>

      {concepts.length === 0 ? (
        <section className="glass" aria-label="No chosen concepts">
          <div className="kicker" style={{ color: "var(--amber)" }}>Nothing to test yet</div>
          <p style={{ marginBottom: 0 }}>
            Choose 3–5 concepts on the{" "}
            <Link href={`/dashboard/${id}/canvas`}>ideation canvas</Link> and
            build their prototypes — each chosen concept gets a tablet station here.
          </p>
        </section>
      ) : (
        <>
          <div style={{ display: "grid", gap: 16, marginBottom: 28 }}>
            {concepts.map((concept) => (
              <section className="glass-sm" key={concept.id} aria-label={concept.title}>
                <h2 style={{ fontSize: "1.3rem", marginBottom: 4 }}>{concept.title}</h2>
                <p className="muted small" style={{ marginBottom: 10 }}>
                  {momentLabel(sector, concept.moment)} × {mechanismLabel(concept.mechanism)}
                </p>
                <p style={{ marginBottom: 8 }}>
                  <code>/s/{token}/test/{concept.id}</code>{" "}
                  <Link
                    href={`/s/${token}/test/${concept.id}`}
                    className="muted"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    (open station view)
                  </Link>
                </p>
                <p className="muted small" style={{ marginBottom: 0 }}>
                  {concept.reactions} reaction{concept.reactions === 1 ? "" : "s"} captured
                </p>
              </section>
            ))}
          </div>

          <section className="glass" aria-label="Panel totals">
            <div className="kicker" style={{ color: "var(--mint)" }}>The panel so far</div>
            <p style={{ fontSize: "1.05rem", lineHeight: 1.7, marginBottom: 8 }}>
              {totalRows} reaction{totalRows === 1 ? "" : "s"} from{" "}
              {panelists} panelist{panelists === 1 ? "" : "s"}.
            </p>
            <p className="muted small" style={{ marginBottom: 14 }}>
              Genereer de readout zodra de reacties binnen zijn — dan synthetiseren
              we de ranking en de pilotaanbeveling.
            </p>
            <Link className="btn btn-secondary" href={`/dashboard/${id}/readout`}>
              Naar de readout →
            </Link>
          </section>
        </>
      )}
    </>
  );
}
