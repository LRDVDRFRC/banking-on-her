import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { ALLOWED_EXTENSIONS, fileExtension } from "@/lib/extract";
import { ingestDocument } from "@/lib/analyze-doc";

export const dynamic = "force-dynamic";
// Extraction + Claude analysis of a 4MB pdf can take a while.
export const maxDuration = 120;

const MAX_BYTES = 4 * 1024 * 1024;

/**
 * Client-facing data-room upload. The sprint token IS the auth (same model as
 * the rest of /s/[token]/*) — no basic auth here. Accepts a progressive-
 * enhancement multipart form (form=1 → 303 back to the intake page) or a
 * plain API call (JSON response). Client-facing errors are Dutch.
 */
export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Ongeldige upload — verstuur het formulier opnieuw." },
      { status: 400 }
    );
  }

  const token = String(form.get("token") ?? "").trim();
  const name = String(form.get("name") ?? "").trim();
  const file = form.get("file");
  const wantsHtml =
    form.get("form") === "1" || (req.headers.get("accept") ?? "").includes("text/html");

  await ensureSchema();
  const sprintRes = await db().execute({
    sql: "SELECT id FROM sprints WHERE token = ?",
    args: [token],
  });
  if (sprintRes.rows.length === 0) {
    return NextResponse.json(
      { error: "Deze sprintlink is niet (meer) geldig." },
      { status: 404 }
    );
  }
  const sprintId = String(sprintRes.rows[0].id);

  // Validation failures: form posts bounce back to the intake page with a
  // readable Dutch message; API calls get a 4xx JSON body.
  const fail = (status: number, message: string) => {
    if (wantsHtml) {
      const url = new URL(`/s/${token}/intake`, req.url);
      url.searchParams.set("upload_error", message);
      url.hash = "documenten";
      return NextResponse.redirect(url, 303);
    }
    return NextResponse.json({ error: message }, { status });
  };

  if (!name) {
    return fail(400, "Vul je naam in zodat we weten van wie het document komt.");
  }
  if (!(file instanceof File) || file.size === 0) {
    return fail(400, "Kies eerst een bestand om te uploaden.");
  }
  if (file.size > MAX_BYTES) {
    return fail(
      413,
      "Dit bestand is groter dan 4 MB. Verklein het (of splits het op) en probeer het opnieuw."
    );
  }
  const ext = fileExtension(file.name);
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return fail(
      400,
      "Dit bestandstype wordt niet ondersteund. Upload een pdf, pptx, docx, txt, md of csv."
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const { id, status } = await ingestDocument({
    sprintId,
    filename: file.name,
    mime: file.type,
    buf,
    uploadedBy: name,
  });

  if (wantsHtml) {
    const url = new URL(`/s/${token}/intake`, req.url);
    url.searchParams.set("uploaded", file.name);
    url.hash = "documenten";
    return NextResponse.redirect(url, 303);
  }
  return NextResponse.json({ ok: true, id, status, filename: file.name });
}
