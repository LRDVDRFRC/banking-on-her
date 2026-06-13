import { buildFilledDeck } from "@/lib/fill-deck";

export const dynamic = "force-dynamic";

/**
 * One-click Day-2 deck — serves the boardroom proposition deck filled with
 * this sprint's client name, Dutch sprint date and merged readiness scores
 * (see lib/fill-deck.ts). Renders inline as a live HTML deck.
 *
 * Lives under /dashboard so the basic-auth middleware already covers it.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const result = await buildFilledDeck(id);
  if (result === null) {
    return new Response(JSON.stringify({ error: "Sprint not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(result.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": "inline",
    },
  });
}
