import { notFound } from "next/navigation";
import { db, ensureSchema } from "@/lib/db";
import { registerParticipant } from "@/app/actions";
import { formatDutchDate } from "@/lib/dates";
import { sectorVocab } from "@/lib/sectors";

export const dynamic = "force-dynamic";

const DOC_STATUS_DOT: Record<string, { color: string; label: string }> = {
  analyzed: { color: "var(--mint)", label: "gelezen" },
  pending_ai: { color: "var(--amber)", label: "in behandeling" },
  extract_failed: { color: "var(--rose)", label: "ontvangen" },
};

export default async function IntakePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ uploaded?: string; upload_error?: string }>;
}) {
  const { token } = await params;
  const { uploaded, upload_error: uploadError } = await searchParams;
  await ensureSchema();
  const res = await db().execute({
    sql: "SELECT id, client, sprint_date, sector FROM sprints WHERE token = ?",
    args: [token],
  });
  if (res.rows.length === 0) notFound();
  const sprintId = String(res.rows[0].id);
  const client = String(res.rows[0].client);
  const vocab = sectorVocab(res.rows[0].sector == null ? null : String(res.rows[0].sector));
  const sprintDate = formatDutchDate(
    res.rows[0].sprint_date == null ? null : String(res.rows[0].sprint_date)
  );

  const docsRes = await db().execute({
    sql: `SELECT filename, uploaded_by, status FROM documents
          WHERE sprint_id = ? ORDER BY created_at ASC`,
    args: [sprintId],
  });
  const docs = docsRes.rows.map((r) => ({
    filename: String(r.filename),
    uploadedBy: r.uploaded_by == null ? null : String(r.uploaded_by),
    status: r.status == null ? "pending_ai" : String(r.status),
  }));

  return (
    <>
      <div className="page-label">
        24-uur propositie sprint · {client}
        {sprintDate ? ` · ${sprintDate}` : ""}
      </div>
      <h1 style={{ fontSize: "2.4rem", fontWeight: 700, marginBottom: 20, maxWidth: 760 }}>
        Eén dag bouwen.{" "}
        <span className="spectrum-text">De ochtend erna ligt er een propositie.</span>
      </h1>
      <p className="intro-note" style={{ marginBottom: 16 }}>
        Binnenkort zitten we één dag met elkaar om de tafel. We beginnen met wat
        jullie al weten, kiezen samen de grootste kans, en bouwen die dezelfde
        dag uit tot een propositie met cijfers erachter. De ochtend erna
        presenteren we het resultaat — en beslissen jullie of het doorgaat.
      </p>
      <p className="intro-note" style={{ marginBottom: 36 }}>
        Daarvoor vragen we nu twee dingen van je. Eerst: vul hieronder je naam
        in en geef in een paar zinnen je eigen kijk. Daarna volgt een korte
        zelfscan van zo&rsquo;n 15 minuten. Geen voorbereiding nodig, geen goede of
        foute antwoorden — alleen hoe het vandaag echt is.
      </p>

      <section className="glass">
        <div className="kicker" style={{ color: "var(--sky)" }}>Doe je mee? Vul dit in</div>
        <form action={registerParticipant}>
          <input type="hidden" name="token" value={token} />
          <div className="fields">
            <div className="field">
              <label htmlFor="name">Naam</label>
              <input id="name" name="name" type="text" required autoComplete="name" placeholder="Voor- en achternaam" />
            </div>
            <div className="field">
              <label htmlFor="role">Rol</label>
              <input id="role" name="role" type="text" placeholder="bijv. Productmanager" />
            </div>
          </div>
          <div className="field-full">
            <label htmlFor="prework">
              Waar denk jij dat {client} geld laat liggen — voor vrouwelijke {vocab.klanten} én voor {client} zelf?
            </label>
            <textarea
              id="prework"
              name="prework"
              placeholder="Schrijf op wat je écht denkt — drie zinnen is genoeg."
            />
            <p className="field-hint">In 3 zinnen. Er is geen fout antwoord; juist de verschillen tussen collega&rsquo;s zijn waardevol.</p>
          </div>
          <div className="btn-row" style={{ marginTop: 28 }}>
            <button type="submit" className="btn btn-primary">Naar de zelfscan →</button>
            <span className="muted small">De zelfscan duurt ±15 minuten.</span>
          </div>
        </form>
      </section>

      <section className="glass" id="documenten" style={{ marginTop: 32 }}>
        <div className="kicker" style={{ color: "var(--rose)" }}>
          Documenten voor de sprint
        </div>
        <p className="intro-note" style={{ fontSize: "1rem", marginBottom: 20 }}>
          Hebben jullie onderzoek, presentaties of rapporten die ons helpen om
          goed beslagen ten ijs te komen? Upload ze hier — wij lezen alles
          vooraf en nemen de inzichten mee de sprintdag in. Max 4 MB per
          bestand; pdf, pptx, docx, txt of csv.
        </p>

        {uploaded && (
          <p
            className="small"
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              background: "rgba(159,212,176,0.3)",
              border: "1px solid rgba(159,212,176,0.7)",
              marginBottom: 20,
            }}
          >
            <strong>{uploaded}</strong> is geüpload — dank! Voeg gerust nog meer
            documenten toe.
          </p>
        )}
        {uploadError && (
          <p
            className="small"
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              background: "rgba(245,184,150,0.3)",
              border: "1px solid rgba(245,184,150,0.7)",
              marginBottom: 20,
            }}
          >
            {uploadError}
          </p>
        )}

        <form action="/api/upload" method="post" encType="multipart/form-data">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="form" value="1" />
          <div className="fields">
            <div className="field">
              <label htmlFor="doc-name">Je naam</label>
              <input
                id="doc-name"
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="Zodat we weten van wie het komt"
              />
            </div>
            <div className="field">
              <label htmlFor="doc-file">Bestand</label>
              <input
                id="doc-file"
                name="file"
                type="file"
                required
                accept=".pdf,.pptx,.docx,.txt,.md,.csv"
              />
            </div>
          </div>
          <div className="btn-row" style={{ marginTop: 24 }}>
            <button type="submit" className="btn btn-secondary">
              Upload document
            </button>
          </div>
        </form>

        {docs.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <p className="muted small" style={{ marginBottom: 10 }}>
              Al gedeeld voor deze sprint:
            </p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {docs.map((doc, i) => {
                const dot = DOC_STATUS_DOT[doc.status] ?? DOC_STATUS_DOT.pending_ai;
                return (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 10,
                      padding: "6px 0",
                      borderBottom: "1px solid rgba(13,59,46,0.08)",
                    }}
                  >
                    <span
                      title={dot.label}
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        background: dot.color,
                        flexShrink: 0,
                        alignSelf: "center",
                      }}
                    />
                    <span style={{ fontWeight: 600 }}>{doc.filename}</span>
                    {doc.uploadedBy && (
                      <span className="muted small">van {doc.uploadedBy}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      <p className="footer-note">Unlockt · Gender Capital Lab™ Sprint · {client}</p>
    </>
  );
}
