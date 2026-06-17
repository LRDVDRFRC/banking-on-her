import Link from "next/link";
import { notFound } from "next/navigation";
import Ring from "@/components/Ring";
import SprintNav from "@/components/SprintNav";
import IntelCollector from "@/components/IntelCollector";
import { db, ensureSchema } from "@/lib/db";
import { formatDutchDate } from "@/lib/dates";
import { regionLabel, sectorLabel } from "@/lib/sectors";
import {
  DIMENSIONS, bandFor, mergePcts, overallPct, type DimensionKey,
} from "@/lib/scoring";

export const dynamic = "force-dynamic";

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await ensureSchema();
  const c = db();

  const sprintRes = await c.execute({
    sql: "SELECT id, client, sprint_date, token, sector, region, research_brief, readout_json, intel_at FROM sprints WHERE id = ?",
    args: [id],
  });
  if (sprintRes.rows.length === 0) notFound();
  const s = sprintRes.rows[0];
  const intelAt = s.intel_at == null ? null : String(s.intel_at);
  const aiEnabled = Boolean(process.env.ANTHROPIC_API_KEY);
  const client = String(s.client);
  const token = String(s.token);
  const sector = s.sector == null ? "pensioen" : String(s.sector);
  const region = s.region == null ? "nl" : String(s.region);
  const sprintDate = formatDutchDate(s.sprint_date == null ? null : String(s.sprint_date));
  const hasResearch = s.research_brief != null;
  const hasReadout = s.readout_json != null;

  const count = async (sql: string) =>
    Number((await c.execute({ sql, args: [id] })).rows[0].n);
  const [participants, assessments, documents, concepts, chosen, protos, feedback, panelists] =
    await Promise.all([
      count("SELECT count(*) AS n FROM participants WHERE sprint_id = ?"),
      count("SELECT count(*) AS n FROM assessments WHERE sprint_id = ?"),
      count("SELECT count(*) AS n FROM documents WHERE sprint_id = ?"),
      count("SELECT count(*) AS n FROM concepts WHERE sprint_id = ?"),
      count("SELECT count(*) AS n FROM concepts WHERE sprint_id = ? AND chosen = 1"),
      count("SELECT count(*) AS n FROM concepts WHERE sprint_id = ? AND chosen = 1 AND prototype_json IS NOT NULL"),
      count("SELECT count(*) AS n FROM feedback WHERE sprint_id = ?"),
      count("SELECT count(DISTINCT panelist) AS n FROM feedback WHERE sprint_id = ?"),
    ]);

  // compact readiness glance
  const scoreRes = await c.execute({
    sql: `SELECT s.mens_organisatie, s.data, s.marketing_communicatie, s.ecosystemen, s.proposities
          FROM participants p JOIN assessments a ON a.participant_id = p.id
          JOIN scores s ON s.assessment_id = a.id WHERE p.sprint_id = ?`,
    args: [id],
  });
  let overall: number | null = null, bandLabel = "", bandColor = "";
  let lowest: string[] = [];
  if (scoreRes.rows.length > 0) {
    const merged = Object.fromEntries(
      DIMENSIONS.map((d) => [d.key, mergePcts(scoreRes.rows.map((r) => Number(r[d.key])))])
    ) as Record<DimensionKey, number>;
    overall = overallPct(DIMENSIONS.map((d) => merged[d.key]));
    const b = bandFor(overall); bandLabel = b.label; bandColor = b.color;
    lowest = [...DIMENSIONS].sort((a, b) => merged[a.key] - merged[b.key]).slice(0, 2).map((d) => d.label);
  }

  type Card = { n: string; title: string; status: string; href: string; done: boolean };
  const journey: Card[] = [
    { n: "1", title: "Intake", href: `/dashboard/${id}/intake`, done: assessments > 0,
      status: participants === 0 ? "Deel de intakelink met het klantteam"
        : `${participants} aangemeld · ${assessments} zelfscan${assessments === 1 ? "" : "s"} · ${documents} document${documents === 1 ? "" : "en"}` },
    { n: "2", title: "Findings — de spiegel", href: `/dashboard/${id}/findings`, done: assessments > 0,
      status: assessments === 0 ? "Wacht op de eerste zelfscans"
        : `Readiness ${overall}% · ${hasResearch ? "marktonderzoek klaar" : "marktonderzoek nog niet gedraaid"}` },
    { n: "3", title: "Ideatie — canvas", href: `/dashboard/${id}/canvas`, done: concepts > 0,
      status: concepts === 0 ? "Nog geen concepten" : `${concepts} concept${concepts === 1 ? "" : "en"} · ${chosen} gekozen` },
    { n: "4", title: "Prototypes", href: `/dashboard/${id}/prototypes`, done: protos > 0,
      status: chosen === 0 ? "Kies eerst concepten op het canvas" : `${protos} van ${chosen} gebouwd` },
    { n: "5", title: "Test — avondpanel", href: `/dashboard/${id}/test`, done: feedback > 0,
      status: feedback === 0 ? "Nog geen testreacties" : `${feedback} reacties van ${panelists} panellid${panelists === 1 ? "" : "(s)"}` },
    { n: "6", title: "Readout — beslissing", href: `/dashboard/${id}/readout`, done: hasReadout,
      status: hasReadout ? "Aanbeveling klaar" : "Nog niet gegenereerd" },
  ];

  return (
    <>
      <div className="page-label">Facilitator · Overzicht</div>
      <h1 style={{ fontSize: "2.4rem", fontWeight: 700, marginBottom: 8 }}>{client}</h1>
      <p className="intro-note" style={{ marginBottom: 8 }}>
        {sectorLabel(sector)} · {regionLabel(region)}
        {" · "}{sprintDate ? `Sprintdag: ${sprintDate}` : "Sprintdag: nog niet gepland"}
      </p>
      <p className="muted small" style={{ marginBottom: 24 }}>
        Klant-intakelink: <code>/s/{token}/intake</code>{" "}
        <Link href={`/s/${token}/intake`} className="muted">(openen)</Link>
      </p>

      <SprintNav sprintId={id} active="overview" />

      <IntelCollector sprintId={id} collectedAt={intelAt} enabled={aiEnabled} />

      {/* compact readiness glance */}
      {overall !== null && (
        <section className="glass" style={{ marginBottom: 28 }} aria-label="Readiness in één oogopslag">
          <div style={{ display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
            <Ring pct={overall} size={120} />
            <div>
              <div className="kicker" style={{ color: "var(--sky)" }}>Readiness van het team</div>
              <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "1.3rem", color: bandColor, margin: "2px 0 6px" }}>
                {overall}% — {bandLabel}
              </p>
              {lowest.length > 0 && (
                <p className="muted" style={{ marginBottom: 0 }}>
                  De dag richt zich op de laagste twee: <strong>{lowest[0]}</strong> en <strong>{lowest[1]}</strong>.
                </p>
              )}
              <p className="muted small" style={{ marginTop: 8, marginBottom: 0 }}>
                Het volledige beeld staat onder <Link href={`/dashboard/${id}/findings`}>Findings</Link>.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* the journey */}
      <div className="kicker" style={{ color: "var(--ink)", opacity: 0.5, marginBottom: 12 }}>De sprint, fase voor fase</div>
      <div className="journey">
        {journey.map((card) => (
          <Link key={card.n} href={card.href} className={`journey-card${card.done ? " done" : ""}`}>
            <span className="journey-num">{card.n}</span>
            <span className="journey-body">
              <span className="journey-title">{card.title}</span>
              <span className="journey-status">{card.status}</span>
            </span>
            <span className="journey-arrow" aria-hidden="true">→</span>
          </Link>
        ))}
      </div>

      <p className="muted small" style={{ marginTop: 22 }}>
        Doorlopend bereikbaar:{" "}
        <Link href={`/dashboard/${id}/deliverables`}>Deliverables</Link> (deck · dossier · briefing · export) ·{" "}
        <Link href="/research">Research-bibliotheek</Link> ·{" "}
        <Link href="/research/ask">Ask AI</Link>.
      </p>
    </>
  );
}
