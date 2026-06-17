import { notFound } from "next/navigation";
import CanvasBoard, { type CanvasConcept } from "@/components/CanvasBoard";
import SprintNav from "@/components/SprintNav";
import { db, ensureSchema } from "@/lib/db";
import { formatDutchDate } from "@/lib/dates";
import { MECHANISMS, momentsFor } from "@/lib/moments";
import { regionLabel, sectorLabel } from "@/lib/sectors";

export const dynamic = "force-dynamic";

/**
 * Phase 4 — Ideation canvas. At 12:30 the room converges on 3–5 testable
 * concepts on the moment × mechanism grid; the diversity rule (different
 * cells) is what makes the evening test yield signal.
 */
export default async function CanvasPage({
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
  const sprint = sprintRes.rows[0];
  const client = String(sprint.client);
  const sector = sprint.sector == null ? "pensioen" : String(sprint.sector);
  const region = sprint.region == null ? "nl" : String(sprint.region);
  const sprintDate = formatDutchDate(
    sprint.sprint_date == null ? null : String(sprint.sprint_date)
  );

  const moments = momentsFor(sector);
  const momentKeys = new Set(moments.map((m) => m.key));
  const mechanismKeys = new Set(MECHANISMS.map((m) => m.key));

  const conceptsRes = await c.execute({
    sql: `SELECT id, title, moment, mechanism, description, source, chosen, prototype_json
          FROM concepts WHERE sprint_id = ? ORDER BY created_at ASC, id ASC`,
    args: [id],
  });
  const all = conceptsRes.rows.map(
    (r): CanvasConcept => ({
      id: String(r.id),
      title: String(r.title),
      moment: String(r.moment),
      mechanism: String(r.mechanism),
      description: r.description == null ? null : String(r.description),
      source: r.source === "ai" ? "ai" : "room",
      chosen: Number(r.chosen) === 1,
      hasPrototype: r.prototype_json != null,
    })
  );
  // Concepts whose axes don't exist on this sector's grid (e.g. the sprint's
  // sector changed after ideation) can't be placed — keep them out of the
  // board but say so rather than losing them silently.
  const concepts = all.filter(
    (x) => momentKeys.has(x.moment) && mechanismKeys.has(x.mechanism)
  );
  const orphaned = all.length - concepts.length;

  return (
    <>
      <div className="page-label">Facilitator · Phase 4 · 12:30</div>
      <h1 style={{ fontSize: "2.2rem", fontWeight: 700, marginBottom: 8 }}>
        Ideation canvas — Phase 4
      </h1>
      <p className="intro-note" style={{ marginBottom: 8 }}>
        {client} · {sectorLabel(sector)} · {regionLabel(region)}
        {sprintDate ? ` · Sprint day: ${sprintDate}` : ""}
      </p>

      <SprintNav sprintId={id} active="ideatie" />

      <p style={{ maxWidth: 760, lineHeight: 1.7, marginBottom: 28 }}>
        By 12:30 the room converges on <strong>3–5 testable concepts</strong>.
        Every concept occupies one cell of the moment × mechanism grid below —
        and the chosen set should spread across <strong>different cells</strong>.
        Five variants of one idea test as one idea; different cells give
        tonight&rsquo;s panel real signal to decide on tomorrow morning.
        Concept titles and descriptions are in Dutch — they face the room.
      </p>

      {orphaned > 0 && (
        <p className="small" style={{ color: "#8a6d3b", fontWeight: 600, marginBottom: 18 }}>
          {orphaned} concept{orphaned === 1 ? "" : "s"} from an earlier sector
          setting can&rsquo;t be placed on this grid and {orphaned === 1 ? "is" : "are"} hidden.
        </p>
      )}

      <CanvasBoard
        sprintId={id}
        moments={moments}
        mechanisms={MECHANISMS}
        concepts={concepts}
        aiEnabled={Boolean(process.env.ANTHROPIC_API_KEY)}
      />
    </>
  );
}
