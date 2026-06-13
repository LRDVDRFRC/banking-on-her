import { randomBytes } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { extractText, ExtractError } from "@/lib/extract";

/** Structured analysis of one data-room document, as stored on the row. */
export interface DocAnalysis {
  excerpt: string;
  key_stats: string[];
  relevance: string;
}

export type DocStatus = "analyzed" | "pending_ai" | "extract_failed";

/** Keep prompts bounded: ~40K chars ≈ 10K tokens of document text. */
const MAX_ANALYSIS_CHARS = 40_000;

const SYSTEM_PROMPT = `You are the document analyst for Unlockt, a consultancy that runs 24-hour proposition sprints helping financial institutions serve women clients better ("gender lens finance" — always the commercial business case, never the moral case, no DEI jargon).

A sprint client or facilitator has uploaded a document to the sprint's data room. Your job is to produce a quick read the facilitator can scan in seconds. Write in ENGLISH, regardless of the document's language.

Rules:
- excerpt: ~120 words. Say what the document is (type, source, scope) and surface the content most relevant to decisions about serving women clients — market sizing, customer segments, product gaps, channel data, strategy.
- key_stats: ONLY numbers that literally appear in the document text, each with just enough context to stand alone (e.g. "27% van de vrouwen heeft geen pensioenopbouw"). Keep the original language of the stat. Return [] if the document contains no meaningful numbers. Never compute, estimate, or import numbers from outside the text.
- relevance: 1–2 sentences on how this document helps the proposition sprint specifically.`;

const ANALYSIS_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    excerpt: {
      type: "string",
      description:
        "~120-word English quick read: what the document is plus its most decision-relevant content for serving women clients.",
    },
    key_stats: {
      type: "array",
      items: { type: "string" },
      description:
        "Numbers literally present in the document text, each with brief context. Empty array if none.",
    },
    relevance: {
      type: "string",
      description: "1-2 English sentences on how this document helps the sprint.",
    },
  },
  required: ["excerpt", "key_stats", "relevance"],
  additionalProperties: false,
};

/**
 * Ask Claude for a structured quick-read of an extracted document.
 * Requires ANTHROPIC_API_KEY; callers gate on that before calling.
 */
export async function analyzeDocument(filename: string, text: string): Promise<DocAnalysis> {
  const client = new Anthropic();
  const body = text.length > MAX_ANALYSIS_CHARS ? text.slice(0, MAX_ANALYSIS_CHARS) : text;

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    output_config: {
      format: { type: "json_schema", schema: ANALYSIS_SCHEMA },
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Filename: ${filename}\n\nDocument text:\n\n${body}`,
      },
    ],
  });

  const textBlock = response.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text"
  );
  if (!textBlock) {
    throw new Error("Analysis response contained no text block");
  }

  const parsed = JSON.parse(textBlock.text) as DocAnalysis;
  return {
    excerpt: typeof parsed.excerpt === "string" ? parsed.excerpt.trim() : "",
    key_stats: Array.isArray(parsed.key_stats)
      ? parsed.key_stats.filter((s): s is string => typeof s === "string")
      : [],
    relevance: typeof parsed.relevance === "string" ? parsed.relevance.trim() : "",
  };
}

/**
 * Shared upload pipeline for both upload routes: extract text from the file,
 * analyze it with Claude when an API key is configured, and INSERT the
 * documents row (always keeping the original bytes).
 *
 * - extraction OK + key      → status 'analyzed'
 * - extraction OK + no key   → status 'pending_ai'
 * - extraction OK + AI error → status 'pending_ai' (file + text survive; analysis can be retried)
 * - ExtractError             → status 'extract_failed' (file still stored)
 */
export async function ingestDocument(opts: {
  sprintId: string;
  filename: string;
  mime: string;
  buf: Buffer;
  uploadedBy: string;
}): Promise<{ id: string; status: DocStatus }> {
  let status: DocStatus;
  let extractedChars = 0;
  let analysis: DocAnalysis | null = null;

  try {
    const text = await extractText(opts.filename, opts.mime, opts.buf);
    extractedChars = text.length;
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        analysis = await analyzeDocument(opts.filename, text);
        status = "analyzed";
      } catch (err) {
        console.error(`Document analysis failed for ${opts.filename}:`, err);
        status = "pending_ai";
      }
    } else {
      status = "pending_ai";
    }
  } catch (err) {
    if (!(err instanceof ExtractError)) throw err;
    status = "extract_failed";
  }

  const id = `doc_${randomBytes(6).toString("hex")}`;
  await db().execute({
    sql: `INSERT INTO documents
          (id, sprint_id, filename, mime, size_bytes, uploaded_by, extracted_chars,
           excerpt, key_stats, relevance, status, content, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      opts.sprintId,
      opts.filename,
      opts.mime || null,
      opts.buf.length,
      opts.uploadedBy,
      extractedChars,
      analysis?.excerpt ?? null,
      analysis ? JSON.stringify(analysis.key_stats) : null,
      analysis?.relevance ?? null,
      status,
      opts.buf,
      new Date().toISOString(),
    ],
  });

  return { id, status };
}
