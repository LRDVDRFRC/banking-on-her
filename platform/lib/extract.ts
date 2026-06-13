import JSZip from "jszip";

/**
 * Typed error for everything that can go wrong while extracting text from an
 * uploaded document. `code` lets the upload routes distinguish "we don't
 * support this file type" from "the file is corrupt / unparseable".
 */
export class ExtractError extends Error {
  constructor(
    public readonly code: "unsupported_type" | "parse_failed" | "empty",
    message: string
  ) {
    super(message);
    this.name = "ExtractError";
  }
}

export const ALLOWED_EXTENSIONS = ["pdf", "pptx", "docx", "txt", "md", "csv"] as const;

export function fileExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot + 1).toLowerCase();
}

/** Decode the handful of XML entities Office files actually emit. */
function decodeXmlEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/**
 * Pull the visible text runs out of one OOXML part. Paragraph close tags
 * become newlines; text runs (`<a:t>` for pptx, `<w:t>` for docx) within a
 * paragraph are joined directly.
 */
function ooxmlPartToText(xml: string, runTag: "a:t" | "w:t", paragraphTag: "a:p" | "w:p"): string {
  const paragraphs = xml.split(new RegExp(`</${paragraphTag}>`));
  const runRe = new RegExp(`<${runTag}(?:\\s[^>]*)?>([\\s\\S]*?)</${runTag}>`, "g");
  const lines: string[] = [];
  for (const para of paragraphs) {
    const runs: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = runRe.exec(para)) !== null) runs.push(decodeXmlEntities(m[1]));
    const line = runs.join("").trim();
    if (line) lines.push(line);
  }
  return lines.join("\n");
}

async function extractPdf(buf: Buffer): Promise<string> {
  const { extractText: unpdfExtractText } = await import("unpdf");
  const { text } = await unpdfExtractText(new Uint8Array(buf), { mergePages: true });
  return text;
}

async function extractPptx(buf: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buf);
  // ppt/slides/slide1.xml, slide2.xml, ... — sort numerically so slide10
  // doesn't land before slide2.
  const slideNames = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)\.xml$/)![1], 10);
      const nb = parseInt(b.match(/slide(\d+)\.xml$/)![1], 10);
      return na - nb;
    });
  if (slideNames.length === 0) {
    throw new ExtractError("parse_failed", "No slides found in pptx archive");
  }
  const slides: string[] = [];
  for (const name of slideNames) {
    const xml = await zip.files[name].async("string");
    const text = ooxmlPartToText(xml, "a:t", "a:p");
    if (text) slides.push(text);
  }
  return slides.join("\n\n");
}

async function extractDocx(buf: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buf);
  const doc = zip.files["word/document.xml"];
  if (!doc) {
    throw new ExtractError("parse_failed", "word/document.xml missing from docx archive");
  }
  const xml = await doc.async("string");
  return ooxmlPartToText(xml, "w:t", "w:p");
}

/**
 * Extract plain text from an uploaded document. Supports pdf, pptx, docx and
 * plain-text formats (txt/md/csv). Throws `ExtractError` for unsupported
 * types and parse failures.
 */
export async function extractText(filename: string, mime: string, buf: Buffer): Promise<string> {
  const ext = fileExtension(filename);

  let text: string;
  try {
    switch (ext) {
      case "pdf":
        text = await extractPdf(buf);
        break;
      case "pptx":
        text = await extractPptx(buf);
        break;
      case "docx":
        text = await extractDocx(buf);
        break;
      case "txt":
      case "md":
      case "csv":
        text = buf.toString("utf8");
        break;
      default:
        throw new ExtractError(
          "unsupported_type",
          `Unsupported file type ".${ext}" (${mime || "unknown mime"})`
        );
    }
  } catch (err) {
    if (err instanceof ExtractError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    throw new ExtractError("parse_failed", `Failed to parse ${ext} file: ${msg}`);
  }

  const trimmed = text.replace(/\u0000/g, "").trim();
  if (!trimmed) {
    throw new ExtractError("empty", "No extractable text found in document");
  }
  return trimmed;
}
