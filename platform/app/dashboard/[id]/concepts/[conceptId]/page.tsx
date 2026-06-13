import Link from "next/link";
import { notFound } from "next/navigation";
import BuildTrigger from "@/components/BuildTrigger";
import PhoneFrame from "@/components/PhoneFrame";
import { db, ensureSchema } from "@/lib/db";
import { parsePrototype } from "@/lib/prototype";
import { sectorLabel } from "@/lib/sectors";

export const dynamic = "force-dynamic";

/**
 * Phase-5 build pod (facilitator, ENGLISH chrome). One pod per chosen concept:
 * the AI builds the value proposition, the phone mock and the evening test
 * script in one run; the facilitator reviews, rebuilds if needed, and opens
 * the station view for the evening panel.
 */
export default async function ConceptBuildPage({
  params,
}: {
  params: Promise<{ id: string; conceptId: string }>;
}) {
  const { id, conceptId } = await params;
  await ensureSchema();
  const c = db();

  const sprintRes = await c.execute({
    sql: "SELECT id, client, token, sector FROM sprints WHERE id = ?",
    args: [id],
  });
  if (sprintRes.rows.length === 0) notFound();
  const sprint = sprintRes.rows[0];
  const client = String(sprint.client);
  const token = String(sprint.token);

  const conceptRes = await c.execute({
    sql: `SELECT id, title, moment, mechanism, description, chosen, prototype_json, prototype_at
          FROM concepts WHERE id = ? AND sprint_id = ?`,
    args: [conceptId, id],
  });
  if (conceptRes.rows.length === 0) notFound();
  const concept = conceptRes.rows[0];
  const chosen = Number(concept.chosen) === 1;
  const description = concept.description == null ? null : String(concept.description);
  const prototype = parsePrototype(concept.prototype_json);
  const builtAt = concept.prototype_at == null ? null : String(concept.prototype_at);
  const aiEnabled = Boolean(process.env.ANTHROPIC_API_KEY);

  return (
    <>
      <div className="page-label">Facilitator · Build pod · {client}</div>
      <h1 style={{ fontSize: "2.2rem", fontWeight: 700, marginBottom: 8 }}>
        {String(concept.title)}
      </h1>
      <p className="intro-note" style={{ marginBottom: 8 }}>
        {String(concept.moment)} × {String(concept.mechanism)}
        {" · "}
        {sectorLabel(sprint.sector == null ? null : String(sprint.sector))}
        {chosen ? (
          <span
            className="stat-chip"
            style={{ marginLeft: 10, background: "rgba(159,212,176,0.35)" }}
          >
            Chosen for build
          </span>
        ) : null}
      </p>
      {description ? (
        <p className="intro-note" style={{ marginBottom: 8 }}>{description}</p>
      ) : null}
      <p className="muted small no-print" style={{ marginBottom: 28 }}>
        <Link href={`/dashboard/${id}/canvas`} className="muted">← Back to canvas</Link>
        {" · "}
        <Link href={`/dashboard/${id}`} className="muted">Dashboard</Link>
      </p>

      <BuildTrigger
        sprintId={id}
        conceptId={conceptId}
        hasPrototype={prototype !== null}
        builtAt={builtAt}
        enabled={aiEnabled}
      />

      {prototype ? (
        <>
          {/* ---------- value proposition (Dutch content) ---------- */}
          <section className="glass" style={{ marginBottom: 28 }} aria-label="Value proposition">
            <div className="kicker" style={{ color: "var(--sky)" }}>Value proposition</div>
            <h2 style={{ fontSize: "1.6rem", marginBottom: 8 }}>{prototype.valueprop.kop}</h2>
            <p style={{ fontSize: "1.05rem", lineHeight: 1.7, marginBottom: 14 }}>
              {prototype.valueprop.subkop}
            </p>
            <ul style={{ margin: "0 0 0 22px", lineHeight: 1.8 }}>
              {prototype.valueprop.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </section>

          {/* ---------- phone mock preview ---------- */}
          <section className="glass" style={{ marginBottom: 28 }} aria-label="Prototype preview">
            <div className="kicker" style={{ color: "var(--mint)" }}>Prototype preview</div>
            <p className="muted small" style={{ marginBottom: 18 }}>
              The screen the panel sees tonight — sandboxed, self-contained, Dutch.
            </p>
            <PhoneFrame html={prototype.screen_html} scale={0.85} />
          </section>

          {/* ---------- test script (Dutch content) ---------- */}
          <section className="glass-sm" style={{ marginBottom: 28 }} aria-label="Test script">
            <div className="kicker" style={{ color: "var(--rose)" }}>Evening test script</div>
            <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, marginBottom: 6 }}>
              Host intro (read aloud)
            </p>
            <p style={{ lineHeight: 1.7, marginBottom: 18 }}>{prototype.test_script.intro}</p>
            <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, marginBottom: 6 }}>
              Tasks
            </p>
            <ol style={{ margin: "0 0 18px 22px", lineHeight: 1.8 }}>
              {prototype.test_script.tasks.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ol>
            <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, marginBottom: 6 }}>
              Open questions
            </p>
            <ol style={{ margin: "0 0 0 22px", lineHeight: 1.8 }}>
              {prototype.test_script.questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ol>
          </section>

          <section className="glass-sm" aria-label="Station view">
            <div className="kicker" style={{ color: "var(--amber)" }}>Tonight</div>
            <p style={{ lineHeight: 1.7, marginBottom: 12 }}>
              At the tablet station, panelists see the value proposition, the
              full-size prototype and the host&rsquo;s capture form — nothing
              else.
            </p>
            <p style={{ marginBottom: 0 }}>
              <a
                className="btn btn-secondary"
                href={`/s/${token}/test/${conceptId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open station view →
              </a>
            </p>
          </section>
        </>
      ) : (
        <section className="glass" aria-label="Not built yet">
          <div className="kicker" style={{ color: "var(--amber)" }}>Phase 5 · 14:00–17:00</div>
          <p style={{ lineHeight: 1.7, marginBottom: 0 }}>
            Between 14:00 and 17:00 each chosen concept becomes a testable
            package: a value proposition, a clickable phone mock that feels
            like a real {client} app screen, and the script the panel host
            uses tonight. Hit <strong>Build prototype</strong> above — the AI
            anchors every number in this sprint&rsquo;s own findings (readiness
            gaps, research hooks, interview quotes). Review the result, rebuild
            if it misses, then open the station view for the evening test.
          </p>
        </section>
      )}
    </>
  );
}
