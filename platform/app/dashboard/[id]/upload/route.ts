import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { ALLOWED_EXTENSIONS, fileExtension } from "@/lib/extract";
import { ingestDocument } from "@/lib/analyze-doc";

export const dynamic = "force-dynamic";
// Extraction + Claude analysis of a 4MB pdf can take a while.
export const maxDuration = 120;

const MAX_BYTES = 4 * 1024 * 1024;

/**
 * Facilitator data-room upload — middleware already basic-auths /dashboard/*.
 * Same pipeline as /api/upload, but the sprint is looked up by id and
 * uploaded_by is always 'facilitator'. Facilitator-facing errors are English.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid upload — resubmit the form." },
      { status: 400 }
    );
  }

  const file = form.get("file");
  const wantsHtml =
    form.get("form") === "1" || (req.headers.get("accept") ?? "").includes("text/html");

  await ensureSchema();
  const sprintRes = await db().execute({
    sql: "SELECT id FROM sprints WHERE id = ?",
    args: [id],
  });
  if (sprintRes.rows.length === 0) {
    return NextResponse.json({ error: "Sprint not found." }, { status: 404 });
  }

  const fail = (status: number, message: string) => {
    if (wantsHtml) {
      const url = new URL(`/dashboard/${id}`, req.url);
      url.searchParams.set("upload_error", message);
      return NextResponse.redirect(url, 303);
    }
    return NextResponse.json({ error: message }, { status });
  };

  if (!(file instanceof File) || file.size === 0) {
    return fail(400, "Choose a file to upload first.");
  }
  if (file.size > MAX_BYTES) {
    return fail(413, "File exceeds the 4 MB limit — shrink or split it and retry.");
  }
  const ext = fileExtension(file.name);
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return fail(400, "Unsupported file type. Upload a pdf, pptx, docx, txt, md or csv.");
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const { id: docId, status } = await ingestDocument({
    sprintId: id,
    filename: file.name,
    mime: file.type,
    buf,
    uploadedBy: "facilitator",
  });

  if (wantsHtml) {
    const url = new URL(`/dashboard/${id}`, req.url);
    url.searchParams.set("uploaded", file.name);
    return NextResponse.redirect(url, 303);
  }
  return NextResponse.json({ ok: true, id: docId, status, filename: file.name });
}
