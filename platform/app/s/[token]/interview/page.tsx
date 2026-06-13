import { notFound } from "next/navigation";
import InterviewChat from "@/components/InterviewChat";
import { db, ensureSchema } from "@/lib/db";
import { formatDutchDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

// AI intake interview — the step after the self-assessment. The sprint token
// + participant id are the auth, same as the other /s/[token]/* pages.

interface StoredInterview {
  completedAt?: string;
  transcript?: { role: "ai" | "user"; text: string }[];
}

export default async function InterviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const { token } = await params;
  const { p } = await searchParams;

  await ensureSchema();
  const c = db();

  const sprintRes = await c.execute({
    sql: "SELECT id, client FROM sprints WHERE token = ?",
    args: [token],
  });
  if (sprintRes.rows.length === 0) notFound();
  const client = String(sprintRes.rows[0].client);
  const sprintId = String(sprintRes.rows[0].id);

  if (!p) notFound();
  const participantRes = await c.execute({
    sql: "SELECT id, name, interview_json FROM participants WHERE id = ? AND sprint_id = ?",
    args: [p, sprintId],
  });
  if (participantRes.rows.length === 0) notFound();
  const participantId = String(participantRes.rows[0].id);
  const name = String(participantRes.rows[0].name);
  const interviewJson = participantRes.rows[0].interview_json;

  // Already completed → warm thank-you with a short recap line, nothing to do.
  if (interviewJson != null) {
    let recap = "Je antwoorden liggen klaar voor de facilitator.";
    try {
      const stored = JSON.parse(String(interviewJson)) as StoredInterview;
      const answers = stored.transcript?.filter((m) => m.role === "user").length ?? 0;
      const when = stored.completedAt
        ? formatDutchDate(stored.completedAt.slice(0, 10))
        : null;
      recap = `Je ${answers > 0 ? `${answers} antwoorden zijn` : "antwoorden zijn"}${
        when ? ` op ${when}` : ""
      } veilig opgeslagen voor de facilitator.`;
    } catch {
      // Corrupt JSON → keep the generic recap line.
    }
    return (
      <>
        <div className="page-label">24-uur propositie sprint · {client} · Het gesprek</div>
        <section className="glass" style={{ maxWidth: 640 }}>
          <div className="kicker" style={{ color: "var(--mint)" }}>Al afgerond</div>
          <h1 style={{ fontSize: "2rem", marginBottom: 16 }}>
            Dank je wel, {name} — je intake is compleet.
          </h1>
          <p className="intro-note">
            Je hebt het gesprek al gevoerd. {recap} Er is verder niets meer dat
            je hoeft te doen — tot op de sprintdag!
          </p>
        </section>
        <p className="footer-note">Unlockt · Gender Capital Lab™ Sprint · {client}</p>
      </>
    );
  }

  // No API key configured → this step is skipped; the participant is done.
  if (!process.env.ANTHROPIC_API_KEY) {
    return (
      <>
        <div className="page-label">24-uur propositie sprint · {client} · Het gesprek</div>
        <section className="glass" style={{ maxWidth: 640 }}>
          <div className="kicker" style={{ color: "var(--amber)" }}>Niet nodig</div>
          <h1 style={{ fontSize: "2rem", marginBottom: 16 }}>
            Goed nieuws, {name}: je bent klaar.
          </h1>
          <p className="intro-note">
            Het AI-gesprek wordt voor deze sprint overgeslagen — je intake en
            zelfscan zijn alles wat we nodig hebben. Tot op de sprintdag!
          </p>
        </section>
        <p className="footer-note">Unlockt · Gender Capital Lab™ Sprint · {client}</p>
      </>
    );
  }

  return (
    <>
      <div className="page-label">24-uur propositie sprint · {client} · Het gesprek</div>
      <h1 style={{ fontSize: "2.4rem", fontWeight: 700, marginBottom: 20, maxWidth: 760 }}>
        Het gesprek — <span className="spectrum-text">±5 minuten</span>
      </h1>
      <p className="intro-note" style={{ marginBottom: 28 }}>
        Hoi {name} — als afronding van de intake stelt onze interviewer je een
        paar korte vragen. Eén vraag tegelijk, geen goede of foute antwoorden.
        Jouw woorden helpen om de sprintdag bij {client} scherp te maken.
      </p>

      <InterviewChat token={token} participantId={participantId} participantName={name} />

      <p className="footer-note">Unlockt · Gender Capital Lab™ Sprint · {client}</p>
    </>
  );
}
