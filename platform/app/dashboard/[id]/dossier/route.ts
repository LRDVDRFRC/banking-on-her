import { buildDossier } from "@/lib/dossier";

export const dynamic = "force-dynamic";

/**
 * GET /dashboard/[id]/dossier — the client-facing evidence dossier as a
 * complete, self-contained, printable HTML document (built in lib/dossier.ts).
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const html = await buildDossier(id);
  if (html === null) {
    return Response.json({ error: "Sprint not found" }, { status: 404 });
  }
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
