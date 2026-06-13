import { notFound } from "next/navigation";
import FeedbackCapture from "@/components/FeedbackCapture";
import PhoneFrame from "@/components/PhoneFrame";
import { db, ensureSchema } from "@/lib/db";
import { parsePrototype } from "@/lib/prototype";

export const dynamic = "force-dynamic";

/**
 * Evening station view (18:00–21:00) — what a panelist sees on the tablet at
 * one concept's test station. Token-gated like the intake page; everything on
 * screen is DUTCH and there is no facilitator chrome: the value proposition,
 * the full-size prototype, and the panel host's capture form below it.
 */
export default async function TestStationPage({
  params,
}: {
  params: Promise<{ token: string; conceptId: string }>;
}) {
  const { token, conceptId } = await params;
  await ensureSchema();
  const c = db();

  const sprintRes = await c.execute({
    sql: "SELECT id, client FROM sprints WHERE token = ?",
    args: [token],
  });
  if (sprintRes.rows.length === 0) notFound();
  const sprintId = String(sprintRes.rows[0].id);
  const client = String(sprintRes.rows[0].client);

  const conceptRes = await c.execute({
    sql: "SELECT id, prototype_json FROM concepts WHERE id = ? AND sprint_id = ?",
    args: [conceptId, sprintId],
  });
  if (conceptRes.rows.length === 0) notFound();

  const prototype = parsePrototype(conceptRes.rows[0].prototype_json);
  if (prototype === null) notFound();

  return (
    <>
      <div className="page-label">Testpanel · {client}</div>
      <h1
        style={{
          fontSize: "2.2rem",
          fontWeight: 700,
          marginBottom: 10,
          maxWidth: 760,
        }}
      >
        {prototype.valueprop.kop}
      </h1>
      <p className="intro-note" style={{ marginBottom: 32 }}>
        {prototype.valueprop.subkop}
      </p>

      <section
        aria-label="Prototype"
        style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}
      >
        <PhoneFrame html={prototype.screen_html} />
      </section>

      <FeedbackCapture sprintId={sprintId} conceptId={conceptId} token={token} />

      <p className="footer-note">Unlockt · Gender Capital Lab™ Sprint · {client}</p>
    </>
  );
}
