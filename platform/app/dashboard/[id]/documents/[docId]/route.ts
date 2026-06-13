import { db, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Facilitator download of an original data-room upload (middleware basic-auths
 * /dashboard/*). 404s when the document doesn't belong to this sprint, so doc
 * ids can't be fished across sprints.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string; docId: string }> }
) {
  const { id, docId } = await ctx.params;
  await ensureSchema();

  const res = await db().execute({
    sql: "SELECT filename, mime, content FROM documents WHERE id = ? AND sprint_id = ?",
    args: [docId, id],
  });
  if (res.rows.length === 0 || res.rows[0].content == null) {
    return new Response(JSON.stringify({ error: "Document not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const row = res.rows[0];
  const content = row.content as ArrayBuffer | Uint8Array;
  const bytes = content instanceof Uint8Array ? content : new Uint8Array(content);
  const filename = String(row.filename).replace(/[\r\n"]/g, "");
  const mime = row.mime == null || row.mime === "" ? "application/octet-stream" : String(row.mime);

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
