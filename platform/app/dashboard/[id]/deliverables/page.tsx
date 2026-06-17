import Link from "next/link";
import { notFound } from "next/navigation";
import SprintNav from "@/components/SprintNav";
import { db, ensureSchema } from "@/lib/db";
import { formatDutchDate } from "@/lib/dates";
import { regionLabel, sectorLabel } from "@/lib/sectors";

export const dynamic = "force-dynamic";

/**
 * Deliverables — the artifacts produced through and after the sprint: the
 * client deck, the evidence dossier, the diagnose briefing and the raw
 * sprint-data export.
 */
export default async function DeliverablesPage({
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

  return (
    <>
      <div className="page-label">Facilitator · Deliverables</div>
      <h1 style={{ fontSize: "2.4rem", fontWeight: 700, marginBottom: 8 }}>{client}</h1>
      <p className="intro-note" style={{ marginBottom: 8 }}>
        {sectorLabel(sector)} · {regionLabel(region)}
        {" · "}{sprintDate ? `Sprint day: ${sprintDate}` : "Sprint day: not set"}
      </p>

      <SprintNav sprintId={id} active="deliverables" />

      <p style={{ maxWidth: 760, lineHeight: 1.7, marginBottom: 28 }}>
        These are the artifacts produced through and after the sprint — the
        client-facing deck, the evidence dossier, the facilitator briefing, and
        the raw sprint data. Everything below is generated from this sprint&rsquo;s
        own findings.
      </p>

      <section className="glass" aria-label="Output artifacts">
        <div className="kicker" style={{ color: "var(--sky)" }}>Output</div>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 18 }}>Generate the deliverables.</h2>

        <div style={{ display: "grid", gap: 18, marginBottom: 22 }}>
          <div className="btn-row">
            <a className="btn btn-primary" href={`/dashboard/${id}/deck`} target="_blank" rel="noopener noreferrer">
              Generate deck
            </a>
            <span className="muted small">
              De klantpresentatie — readiness, concepten en de pilotaanbeveling in één deck.
            </span>
          </div>
          <div className="btn-row">
            <Link className="btn btn-secondary" href={`/dashboard/${id}/briefing`}>
              Diagnose briefing
            </Link>
            <span className="muted small">
              De facilitatorbriefing met de scherpste bevindingen voor het ochtendgesprek.
            </span>
          </div>
          <div className="btn-row">
            <a className="btn btn-secondary" href={`/dashboard/${id}/dossier`} target="_blank" rel="noopener noreferrer">
              Evidence dossier
            </a>
            <span className="muted small">
              Het bewijsdossier — onderzoek, documenten en quotes onder elke aanbeveling.
            </span>
          </div>
          <div className="btn-row">
            <Link className="btn btn-secondary" href={`/dashboard/${id}/export`}>
              Export sprint-data JSON
            </Link>
            <span className="muted small">
              De ruwe sprintdata als JSON — voor de offline deck-filler hieronder.
            </span>
          </div>
        </div>

        <p className="muted small" style={{ marginBottom: 0 }}>
          De deck en het dossier openen in een nieuw tabblad. De export downloadt
          de ruwe sprintdata als JSON — voer die aan de offline deck-filler:
        </p>
        <code className="code codeblock">
          node ../sprint/08_fill-deck.js sprint-data-{id}.json filled-deck.html
        </code>
      </section>
    </>
  );
}
