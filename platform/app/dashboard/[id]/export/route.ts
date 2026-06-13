import { db, ensureSchema } from "@/lib/db";
import { formatDutchDate } from "@/lib/dates";
import { DIMENSIONS, mergePcts, type DimensionKey } from "@/lib/scoring";

export const dynamic = "force-dynamic";

/**
 * Sprint-data JSON export — exactly the input schema documented in
 * sprint/08_fill-deck.js: { "datum": <date or «datum»>, "scores": {5 keys} }.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  await ensureSchema();
  const c = db();

  const sprintRes = await c.execute({
    sql: "SELECT id, sprint_date FROM sprints WHERE id = ?",
    args: [id],
  });
  if (sprintRes.rows.length === 0) {
    return new Response(JSON.stringify({ error: "Sprint not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  const sprintDate =
    sprintRes.rows[0].sprint_date == null
      ? null
      : String(sprintRes.rows[0].sprint_date);

  const scoreRes = await c.execute({
    sql: `SELECT s.mens_organisatie, s.data, s.marketing_communicatie, s.ecosystemen, s.proposities
          FROM scores s JOIN assessments a ON a.id = s.assessment_id
          WHERE a.sprint_id = ?`,
    args: [id],
  });

  const scores = Object.fromEntries(
    DIMENSIONS.map((d) => {
      const values = scoreRes.rows.map((r) => Number(r[d.key]));
      return [d.key, values.length > 0 ? mergePcts(values) : 0];
    })
  ) as Record<DimensionKey, number>;

  const payload = {
    datum: formatDutchDate(sprintDate) ?? "«datum»",
    scores,
  };

  return new Response(JSON.stringify(payload, null, 2) + "\n", {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="sprint-data-${id}.json"`,
    },
  });
}
