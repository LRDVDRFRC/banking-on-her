import Link from "next/link";
import { db, ensureSchema } from "@/lib/db";

/**
 * Per-sprint phase navigation — the platform follows the sprint timeline.
 * Overzicht · 1 Intake · 2 Findings · 3 Ideatie · 4 Prototypes · 5 Test ·
 * 6 Readout · Deliverables. Rendered on every /dashboard/[id]/* page with the
 * current phase passed as `active`. A filled dot marks a phase that has data.
 */

export type PhaseKey =
  | "overview" | "intake" | "findings" | "ideatie"
  | "prototypes" | "test" | "readout" | "deliverables";

const PHASES: { key: PhaseKey; n?: string; label: string; path: string }[] = [
  { key: "overview",     label: "Overzicht",    path: "" },
  { key: "intake",       n: "1", label: "Intake",       path: "/intake" },
  { key: "findings",     n: "2", label: "Findings",     path: "/findings" },
  { key: "ideatie",      n: "3", label: "Ideatie",      path: "/canvas" },
  { key: "prototypes",   n: "4", label: "Prototypes",   path: "/prototypes" },
  { key: "test",         n: "5", label: "Test",         path: "/test" },
  { key: "readout",      n: "6", label: "Readout",      path: "/readout" },
  { key: "deliverables", label: "Deliverables", path: "/deliverables" },
];

export default async function SprintNav({
  sprintId,
  active,
}: {
  sprintId: string;
  active: PhaseKey;
}) {
  await ensureSchema();
  const c = db();
  const count = async (sql: string) =>
    Number((await c.execute({ sql, args: [sprintId] })).rows[0].n);

  const [assessments, concepts, protos, feedback, sres] = await Promise.all([
    count("SELECT count(*) AS n FROM assessments WHERE sprint_id = ?"),
    count("SELECT count(*) AS n FROM concepts WHERE sprint_id = ?"),
    count("SELECT count(*) AS n FROM concepts WHERE sprint_id = ? AND chosen = 1 AND prototype_json IS NOT NULL"),
    count("SELECT count(*) AS n FROM feedback WHERE sprint_id = ?"),
    c.execute({ sql: "SELECT readout_json FROM sprints WHERE id = ?", args: [sprintId] }),
  ]);
  const done: Partial<Record<PhaseKey, boolean>> = {
    intake: assessments > 0,
    findings: assessments > 0,
    ideatie: concepts > 0,
    prototypes: protos > 0,
    test: feedback > 0,
    readout: sres.rows[0]?.readout_json != null,
  };

  return (
    <nav className="sprintnav no-print" aria-label="Sprintfases">
      {PHASES.map((p) => {
        const cls = [
          "snav-item",
          p.key === active ? "active" : "",
          done[p.key] ? "done" : "",
        ].filter(Boolean).join(" ");
        return (
          <Link key={p.key} href={`/dashboard/${sprintId}${p.path}`} className={cls}>
            {p.n ? <span className="snav-num">{p.n}</span> : null}
            <span className="snav-label">{p.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
