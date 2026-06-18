// Gendered-communication audit of a client's public website.
// Fetches the homepage copy + a few real content images and asks Claude (vision)
// how inclusive the site is and where its TEXT and VISUALS sit on a
// feminine↔masculine spectrum, grounded in concrete evidence.

import Anthropic from "@anthropic-ai/sdk";

export interface AuditAxis {
  /** -100 = strongly feminine-coded · 0 = balanced · +100 = strongly masculine-coded. */
  lean: number;
  leanLabel: string;
  /** 0–100. */
  inclusivity: number;
  summary: string;
  evidence: string[];
}

export interface WebsiteAudit {
  url: string;
  text: AuditAxis;
  visuals: AuditAxis & { imagesAnalysed: number };
  overall: string;
}

const IMG_OK = /image\/(jpeg|png|gif|webp)/i;
const SKIP_IMG = /(logo|icon|favicon|sprite|pixel|spacer|loader|placeholder|\.svg($|\?))/i;

function clamp(n: unknown, lo: number, hi: number, dflt: number): number {
  const v = Number(n);
  return Number.isFinite(v) ? Math.max(lo, Math.min(hi, Math.round(v))) : dflt;
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; UnlocktSprintBot/1.0)" },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractText(html: string): string {
  const noScript = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const text = noScript
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, 14000);
}

function extractImageUrls(html: string, base: string): string[] {
  const urls: string[] = [];
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (og) urls.push(og[1]);
  for (const m of html.matchAll(/<img[^>]+(?:data-src|src)=["']([^"']+)["']/gi)) urls.push(m[1]);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of urls) {
    let abs: string;
    try { abs = new URL(raw, base).href; } catch { continue; }
    if (!/^https?:\/\//.test(abs)) continue;
    if (SKIP_IMG.test(abs)) continue;
    if (seen.has(abs)) continue;
    seen.add(abs);
    out.push(abs);
    if (out.length >= 8) break;
  }
  return out;
}

interface ImageBlock { mediaType: string; data: string; }

async function fetchImages(urls: string[], max: number): Promise<ImageBlock[]> {
  const out: ImageBlock[] = [];
  for (const url of urls) {
    if (out.length >= max) break;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (compatible; UnlocktSprintBot/1.0)" } });
      clearTimeout(t);
      const ct = res.headers.get("content-type") ?? "";
      if (!res.ok || !IMG_OK.test(ct)) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 1500 || buf.length > 3_600_000) continue; // skip tiny + oversized
      out.push({ mediaType: ct.split(";")[0].trim(), data: buf.toString("base64") });
    } catch {
      // skip unreachable image
    }
  }
  return out;
}

const SYSTEM = `You are a brand and communication analyst at Unlockt doing a gendered-communication audit of a financial institution's public homepage. Unlockt helps such institutions serve women clients better — the commercial case, not the moral case.

Assess two things, separately for the TEXT (copy) and the VISUALS (the images shown):
1. INCLUSIVITY (0–100): how well it represents and addresses a diverse audience — who the copy speaks to, plain/accessible language, life-events covered; for visuals: gender/age/cultural representation and the roles people are shown in.
2. GENDER LEAN (-100 to +100): where the tone sits. -100 = strongly feminine-coded (communal, relational, warm, care, "samen", reassurance), 0 = balanced, +100 = strongly masculine-coded (agentic, competitive, control, performance, status, "de beste"). Ground every judgement in concrete evidence — exact quotes for text; specific descriptions for images (who is shown, doing what).

Be specific and fair: name strengths AND gaps. Avoid moralising. If no images were provided, set visual fields to neutral and say visuals could not be assessed.

Output ONLY a JSON object (no prose, no markdown fence) with EXACTLY these keys:
{"text_lean": int, "text_lean_label": short string (e.g. "licht masculien", "gebalanceerd"), "text_inclusivity": int 0-100, "text_summary": string (2-3 sentences), "text_evidence": string[] (short exact quotes from the copy), "visual_lean": int, "visual_lean_label": string, "visual_inclusivity": int 0-100, "visual_summary": string, "visual_evidence": string[] (each describes one image: who/what), "images_analysed": int, "overall": string (2-3 sentences: synthesis + what it means for the sprint)}
Write summaries/labels in Dutch (the client and audience are Dutch); keep quotes verbatim in their original language.`;

function parseAudit(text: string, url: string, imagesAnalysed: number): WebsiteAudit | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  let o: Record<string, unknown>;
  try { o = JSON.parse(text.slice(start, end + 1)); } catch { return null; }
  const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 6) : []);
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    url,
    text: {
      lean: clamp(o.text_lean, -100, 100, 0),
      leanLabel: str(o.text_lean_label) || "gebalanceerd",
      inclusivity: clamp(o.text_inclusivity, 0, 100, 0),
      summary: str(o.text_summary),
      evidence: arr(o.text_evidence),
    },
    visuals: {
      lean: clamp(o.visual_lean, -100, 100, 0),
      leanLabel: str(o.visual_lean_label) || "gebalanceerd",
      inclusivity: clamp(o.visual_inclusivity, 0, 100, 0),
      summary: str(o.visual_summary),
      evidence: arr(o.visual_evidence),
      imagesAnalysed,
    },
    overall: str(o.overall),
  };
}

export async function auditWebsite(client: string, website: string): Promise<WebsiteAudit | null> {
  const html = await fetchHtml(website);
  if (!html) return null;
  const pageText = extractText(html);
  const imageUrls = extractImageUrls(html, website);
  const images = await fetchImages(imageUrls, 4);

  const anthropic = new Anthropic();
  const content: Anthropic.ContentBlockParam[] = [
    {
      type: "text",
      text: `Client: ${client}\nWebsite: ${website}\n\nPAGE TEXT (homepage):\n${pageText}\n\n${images.length} homepage image(s) follow for the visual analysis.`,
    },
    ...images.map((img): Anthropic.ContentBlockParam => ({
      type: "image",
      source: { type: "base64", media_type: img.mediaType as "image/jpeg", data: img.data },
    })),
  ];

  const response = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2200,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    system: SYSTEM,
    messages: [{ role: "user", content }],
  });
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  return parseAudit(text, website, images.length);
}
