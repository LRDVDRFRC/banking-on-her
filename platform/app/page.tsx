import Link from "next/link";
import { db, ensureSchema } from "@/lib/db";
import { createSprint } from "@/app/actions";
import { formatDutchDate } from "@/lib/dates";
import { REGIONS, SECTORS, regionLabel, sectorLabel } from "@/lib/sectors";

export const dynamic = "force-dynamic";

interface SprintRow {
  id: string;
  client: string;
  sprintDate: string | null;
  token: string;
  sector: string;
  region: string;
  participants: number;
  assessments: number;
}

export default async function HomePage() {
  await ensureSchema();
  const res = await db().execute(`
    SELECT
      s.id, s.client, s.sprint_date, s.token, s.sector, s.region,
      (SELECT COUNT(*) FROM participants p WHERE p.sprint_id = s.id) AS participant_count,
      (SELECT COUNT(*) FROM assessments a WHERE a.sprint_id = s.id) AS assessment_count
    FROM sprints s
    ORDER BY s.created_at DESC
  `);
  const sprints: SprintRow[] = res.rows.map((r) => ({
    id: String(r.id),
    client: String(r.client),
    sprintDate: r.sprint_date == null ? null : String(r.sprint_date),
    token: String(r.token),
    sector: r.sector == null ? "pensioen" : String(r.sector),
    region: r.region == null ? "nl" : String(r.region),
    participants: Number(r.participant_count),
    assessments: Number(r.assessment_count),
  }));

  return (
    <>
      <div className="page-label">Facilitator · Sprint overview</div>
      <h1 style={{ fontSize: "2.4rem", fontWeight: 700, marginBottom: 12 }}>
        Sprints
      </h1>
      <p className="intro-note" style={{ marginBottom: 16 }}>
        One sprint per client engagement. Create the sprint, share the client
        intake link with the crew, and watch assessments land on the dashboard.
      </p>
      <p className="muted small" style={{ marginBottom: 32 }}>
        Looking for evidence? Browse the <Link href="/research">research library</Link>.
      </p>

      <section className="glass-sm" style={{ marginBottom: 36 }}>
        <div className="kicker" style={{ color: "var(--sky)" }}>New sprint</div>
        <form action={createSprint}>
          <div className="fields">
            <div className="field">
              <label htmlFor="client">Client name</label>
              <input id="client" name="client" type="text" required placeholder="e.g. BeFrank" />
            </div>
            <div className="field">
              <label htmlFor="sprint_date">Sprint date</label>
              <input id="sprint_date" name="sprint_date" type="date" />
            </div>
          </div>
          <div className="field-full" style={{ marginTop: 24 }}>
            <label htmlFor="website">Website (optional — feeds the deep-research brief)</label>
            <input
              id="website"
              name="website"
              type="url"
              placeholder="https://www.befrank.nl"
            />
          </div>
          <div className="fields" style={{ marginTop: 24, gridTemplateColumns: "1fr 1fr" }}>
            <div className="field">
              <label htmlFor="sector">Sector</label>
              <select id="sector" name="sector" defaultValue="pensioen">
                {Object.entries(SECTORS).map(([key, v]) => (
                  <option key={key} value={key}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="region">Region</label>
              <select id="region" name="region" defaultValue="nl">
                {Object.entries(REGIONS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="btn-row" style={{ marginTop: 24 }}>
            <button type="submit" className="btn btn-primary">Create sprint</button>
            <span className="muted small">Generates a private client link automatically.</span>
          </div>
        </form>
      </section>

      {sprints.length === 0 ? (
        <p className="muted">No sprints yet — create the first one above.</p>
      ) : (
        sprints.map((s) => (
          <section className="glass-sm sprint-card" key={s.id}>
            <h3>{s.client}</h3>
            <p className="sprint-meta">
              {sectorLabel(s.sector)} · {regionLabel(s.region)}
              {" · "}
              {s.sprintDate ? `Sprint day: ${formatDutchDate(s.sprintDate)}` : "Sprint day: not set"}
              {" · "}
              {s.participants} participant{s.participants === 1 ? "" : "s"}
              {" · "}
              {s.assessments} assessment{s.assessments === 1 ? "" : "s"}
            </p>
            <div className="btn-row">
              <Link className="btn btn-primary" href={`/dashboard/${s.id}`}>Dashboard</Link>
              <Link className="btn btn-secondary" href={`/s/${s.token}/intake`}>Open client intake</Link>
            </div>
            <p className="muted small" style={{ marginTop: 14 }}>
              Client link (copy and share, prefixed with this host):{" "}
              <code>/s/{s.token}/intake</code>
            </p>
          </section>
        ))
      )}
    </>
  );
}
