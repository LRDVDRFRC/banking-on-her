import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db, ensureSchema } from "@/lib/db";
import { auditWebsite } from "@/lib/website-audit";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * POST /dashboard/[id]/audit — gendered-communication audit of the client's
 * website (text + visuals). Stored in sprints.website_audit_json. Fired in
 * parallel with /intel by the IntelCollector; best-effort and re-runnable.
 */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  await ensureSchema();
  const c = db();

  const res = await c.execute({
    sql: "SELECT client, website FROM sprints WHERE id = ?",
    args: [id],
  });
  if (res.rows.length === 0) {
    return NextResponse.json({ error: "Sprint not found." }, { status: 404 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }
  const client = String(res.rows[0].client);
  const website = res.rows[0].website == null ? null : String(res.rows[0].website);
  if (!website) {
    return NextResponse.json({ ok: false, reason: "no_website" });
  }

  try {
    const audit = await auditWebsite(client, website);
    if (!audit) {
      return NextResponse.json({ ok: false, reason: "fetch_failed" });
    }
    await c.execute({
      sql: "UPDATE sprints SET website_audit_json = ?, website_audit_at = ? WHERE id = ?",
      args: [JSON.stringify(audit), new Date().toISOString(), id],
    });
    return NextResponse.json({ ok: true, imagesAnalysed: audit.visuals.imagesAnalysed });
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `Claude API error (${error.status}).` }, { status: 502 });
    }
    throw error;
  }
}
