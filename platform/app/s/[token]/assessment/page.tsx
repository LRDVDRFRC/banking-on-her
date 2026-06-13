import Link from "next/link";
import { notFound } from "next/navigation";
import AssessmentForm from "@/components/AssessmentForm";
import Ring from "@/components/Ring";
import { db, ensureSchema } from "@/lib/db";
import {
  BAND_LEGEND,
  DIMENSIONS,
  SCALE,
  bandFor,
  getDimensionDescs,
  getStatements,
  type DimensionKey,
} from "@/lib/scoring";

export const dynamic = "force-dynamic";

export default async function AssessmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ p?: string; error?: string; edit?: string }>;
}) {
  const { token } = await params;
  const { p, error, edit } = await searchParams;

  await ensureSchema();
  const c = db();

  const sprintRes = await c.execute({
    sql: "SELECT id, client, sector FROM sprints WHERE token = ?",
    args: [token],
  });
  if (sprintRes.rows.length === 0) notFound();
  const client = String(sprintRes.rows[0].client);
  const sprintId = String(sprintRes.rows[0].id);
  const sector = sprintRes.rows[0].sector == null ? "pensioen" : String(sprintRes.rows[0].sector);

  const participantRes = p
    ? await c.execute({
        sql: "SELECT id, name, interview_json FROM participants WHERE id = ? AND sprint_id = ?",
        args: [p, sprintId],
      })
    : null;

  if (!participantRes || participantRes.rows.length === 0) {
    return (
      <section className="glass" style={{ maxWidth: 640 }}>
        <div className="kicker" style={{ color: "var(--rose)" }}>Even terug</div>
        <h1 style={{ fontSize: "1.8rem", marginBottom: 16 }}>We kennen deze link niet.</h1>
        <p className="intro-note" style={{ marginBottom: 24 }}>
          Begin bij de intake — daar vul je je naam in en kom je vanzelf bij de
          zelfscan terecht.
        </p>
        <Link className="btn btn-primary" href={`/s/${token}/intake`}>Naar de intake</Link>
      </section>
    );
  }

  const participantId = String(participantRes.rows[0].id);
  const name = String(participantRes.rows[0].name);
  const interviewDone = participantRes.rows[0].interview_json != null;

  // Already submitted → show the participant's own result (bedankt view),
  // unless they explicitly asked to revise their answers (?edit=1).
  const scoreRes = await c.execute({
    sql: `SELECT a.answers_json, s.mens_organisatie, s.data, s.marketing_communicatie, s.ecosystemen, s.proposities, s.overall
          FROM assessments a JOIN scores s ON s.assessment_id = a.id
          WHERE a.participant_id = ?
          ORDER BY a.created_at DESC LIMIT 1`,
    args: [participantId],
  });
  const editing = edit === "1" && scoreRes.rows.length > 0;

  if (scoreRes.rows.length > 0 && !editing) {
    const row = scoreRes.rows[0];
    const overall = Number(row.overall);
    const band = bandFor(overall);
    return (
      <>
        <div className="page-label">24-uur propositie sprint · {client} · Zelfscan</div>
        <section className="glass" style={{ marginBottom: 36 }}>
          <div className="kicker" style={{ color: "var(--mint)" }}>Verstuurd</div>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 700, marginBottom: 16 }}>
            Dank je wel, {name}.
          </h1>
          <p className="intro-note">
            Dit is jouw beeld van waar {client} vandaag staat. De facilitator
            legt straks alle antwoorden naast elkaar — juist waar jullie van
            elkaar verschillen, begint op de sprintdag het gesprek.
          </p>
        </section>

        <section className="glass" aria-label="Jouw resultaat">
          <div className="kicker" style={{ color: "var(--sky)" }}>Jouw readiness</div>
          <h2 style={{ fontSize: "1.6rem", marginBottom: 28 }}>Vijf dimensies, één totaal.</h2>
          <div className="results-grid">
            {DIMENSIONS.map((dim) => (
              <div className="glass-sm result-card" key={dim.key}>
                <Ring pct={Number(row[dim.key])} label={dim.label} size={92} />
              </div>
            ))}
          </div>
          <div className="overall-wrap">
            <Ring pct={overall} size={160} />
            <p className="grade-dim"><strong>Totaal</strong></p>
            <p className="overall-band" style={{ color: band.color }}>{band.label}</p>
            <p className="overall-band-desc">{band.desc}</p>
            <p className="band-legend">{BAND_LEGEND}</p>
          </div>
          <div className="btn-row" style={{ marginTop: 28, justifyContent: "center" }}>
            <Link
              className="btn btn-secondary"
              href={`/s/${token}/assessment?p=${participantId}&edit=1`}
            >
              Pas je antwoorden aan
            </Link>
            <span className="muted small">
              Toch iets anders invullen? Je vorige antwoorden blijven staan tot je
              opnieuw verstuurt.
            </span>
          </div>
        </section>

        {interviewDone ? (
          <section className="glass-sm" style={{ marginTop: 36, textAlign: "center" }}>
            <p style={{ fontWeight: 700, fontSize: "1.15rem", color: "var(--ink)" }}>
              Intake compleet ✓
            </p>
            <p className="muted small" style={{ marginTop: 6 }}>
              Zelfscan én gesprek zijn binnen — er is niets meer dat je hoeft te doen.
            </p>
          </section>
        ) : (
          <section className="glass" style={{ marginTop: 36, textAlign: "center" }}>
            <div className="kicker" style={{ color: "var(--rose)" }}>Nog één ding</div>
            <p className="intro-note" style={{ margin: "0 auto 20px" }}>
              Onze AI-interviewer stelt je nog een paar korte vragen over waar jij
              de kans ziet — jouw woorden maken de sprintdag scherper.
            </p>
            <Link
              className="btn btn-primary"
              href={`/s/${token}/interview?p=${participantId}`}
            >
              Laatste stap: het gesprek (±5 min) →
            </Link>
          </section>
        )}
        <p className="footer-note">Tot op de sprintdag. · Unlockt · Gender Capital Lab™ Sprint</p>
      </>
    );
  }

  // Editing → seed the form with the participant's previous answers.
  let initialAnswers: Partial<Record<DimensionKey, number[]>> | undefined;
  if (editing) {
    try {
      const payload: unknown = JSON.parse(String(scoreRes.rows[0].answers_json));
      if (payload && typeof payload === "object" && "answers" in payload) {
        initialAnswers = (payload as { answers: Partial<Record<DimensionKey, number[]>> })
          .answers;
      }
    } catch {
      // Corrupt answers_json → open the form blank rather than failing.
    }
  }

  // Not yet submitted (or revising) → the 29-statement form.
  return (
    <>
      <div className="page-label">24-uur propositie sprint · {client} · Readiness scan</div>
      <h1 style={{ fontSize: "2.4rem", fontWeight: 700, marginBottom: 20 }}>
        Zelfscan: <span className="spectrum-text">Gender Capital Readiness</span>
      </h1>
      <p className="intro-note" style={{ marginBottom: 28 }}>
        Hoi {name} — vul deze scan zelfstandig in, zonder overleg met
        collega&rsquo;s. Het kost ongeveer <strong>15 minuten</strong>. Beantwoord hoe
        het vandaag <em>écht</em> is, niet hoe het zou moeten zijn. &ldquo;Weet ik
        niet&rdquo; is een eerlijk en bruikbaar antwoord: scoor het als{" "}
        <strong>0</strong>.
      </p>

      {editing ? (
        <section className="glass-sm" style={{ marginBottom: 24 }}>
          <p style={{ fontWeight: 600 }}>
            Je eerdere antwoorden staan al voor je klaar — pas aan wat anders
            moet en verstuur opnieuw. Je nieuwe antwoorden vervangen de oude.
          </p>
        </section>
      ) : null}

      {error === "incomplete" ? (
        <section className="glass-sm" style={{ marginBottom: 24 }}>
          <p style={{ color: "var(--ink)", fontWeight: 600 }}>
            Nog niet alle 29 stellingen waren beantwoord — loop ze hieronder nog even na.
          </p>
        </section>
      ) : null}

      <section className="glass-sm" style={{ marginBottom: 12 }}>
        <div className="kicker" style={{ color: "var(--rose)" }}>
          Zo scoor je — elke stelling van 0 tot 4
        </div>
        {SCALE.map((s) => (
          <div className="legend-row" key={s.value}>
            <span className="legend-score" style={{ color: s.color }}>{s.value}</span>
            <span className="legend-text">{s.text}</span>
          </div>
        ))}
      </section>

      <AssessmentForm
        token={token}
        participantId={participantId}
        statements={getStatements(sector)}
        descs={getDimensionDescs(sector)}
        initialAnswers={initialAnswers}
      />

      <p className="footer-note">Unlockt · Gender Capital Lab™ Sprint · Zelfscan voor {client}</p>
    </>
  );
}
