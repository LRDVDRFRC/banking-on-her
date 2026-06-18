// Evidence dossier — a complete, self-contained, printable HTML document
// (Dutch, Prism brand) that a facilitator can send or print before/after a
// sprint. Bundles the matched research, its key stats, and the sprint's
// merged readiness into one client-facing report.
//
// Query patterns mirror app/dashboard/[id]/page.tsx (research matching) and
// app/dashboard/[id]/export/route.ts (merged scores) — deliberately copied,
// not imported, so this file stays independent of the page components.

import { db, ensureSchema } from "@/lib/db";
import { formatDutchDate } from "@/lib/dates";
import type { WebsiteAudit, AuditAxis } from "@/lib/website-audit";
import {
  regionLabel,
  relevantRegions,
  sectorLabel,
  sectorVocab,
} from "@/lib/sectors";
import {
  DIMENSIONS,
  bandFor,
  mergePcts,
  overallPct,
  type DimensionKey,
} from "@/lib/scoring";

interface DossierReport {
  id: string;
  title: string;
  organization: string | null;
  year: number | null;
  url: string;
  region: string;
  language: string | null;
  excerpt: string;
  keyStats: string[];
}

// ---------------------------------------------------------------- helpers

/** Escape for HTML text nodes and attribute values. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** key_stats column value → string[] (defensive: any malformed value → []). */
function parseKeyStats(value: unknown): string[] {
  if (value == null) return [];
  try {
    const parsed: unknown = JSON.parse(String(value));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is string => typeof s === "string" && s.trim() !== ""
    );
  } catch {
    return [];
  }
}

/** "Organisatie · 2024" source line. */
function sourceLine(r: Pick<DossierReport, "organization" | "year">): string {
  const org = r.organization ?? "Onbekende organisatie";
  return r.year !== null ? `${org} · ${r.year}` : org;
}

/**
 * First prominent figure in a stat string ("40%", "5 op de 10", "€20.887",
 * "1.541") — rendered big on the stat card. Null when the stat carries no
 * obvious number.
 */
function statFigure(stat: string): string | null {
  const m =
    /€\s?\d[\d.,]*|\d+(?:[.,]\d+)?\s*%|\d+\s+op\s+de\s+\d+|\d[\d.,]{2,}/.exec(
      stat
    );
  return m ? m[0].trim() : null;
}

const ACCENTS = ["var(--sky)", "var(--rose)", "var(--amber)", "var(--mint)"];

// ---------------------------------------------------------------- queries

async function fetchResearch(
  sector: string,
  region: string
): Promise<DossierReport[]> {
  const c = db();
  const regions = relevantRegions(region);
  const sqlFor = (cols: string) =>
    `SELECT ${cols}
     FROM research_reports
     WHERE sector IN (?, 'algemeen')
       AND region IN (${regions.map(() => "?").join(", ")})
     ORDER BY CASE WHEN region = ? THEN 0 ELSE 1 END, year DESC, title ASC`;
  const args = [sector, ...regions, region];
  const baseCols =
    "id, title, organization, year, url, region, language, excerpt";

  // key_stats is being added in a parallel migration and may not exist yet on
  // every database — try it, fall back to excerpt-only when the column is
  // missing.
  let rows;
  let withKeyStats = true;
  try {
    rows = (await c.execute({ sql: sqlFor(`${baseCols}, key_stats`), args }))
      .rows;
  } catch {
    withKeyStats = false;
    rows = (await c.execute({ sql: sqlFor(baseCols), args })).rows;
  }

  return rows.map((r) => ({
    id: String(r.id),
    title: String(r.title),
    organization: r.organization == null ? null : String(r.organization),
    year: r.year == null ? null : Number(r.year),
    url: String(r.url),
    region: String(r.region),
    language: r.language == null ? null : String(r.language),
    excerpt: String(r.excerpt),
    keyStats: withKeyStats ? parseKeyStats(r.key_stats) : [],
  }));
}

async function fetchMergedScores(
  sprintId: string
): Promise<{ merged: Record<DimensionKey, number>; overall: number } | null> {
  const c = db();
  const scoreRes = await c.execute({
    sql: `SELECT s.mens_organisatie, s.data, s.marketing_communicatie, s.ecosystemen, s.proposities
          FROM scores s JOIN assessments a ON a.id = s.assessment_id
          WHERE a.sprint_id = ?`,
    args: [sprintId],
  });
  if (scoreRes.rows.length === 0) return null;

  const merged = Object.fromEntries(
    DIMENSIONS.map((d) => [
      d.key,
      mergePcts(scoreRes.rows.map((r) => Number(r[d.key]))),
    ])
  ) as Record<DimensionKey, number>;
  return { merged, overall: overallPct(DIMENSIONS.map((d) => merged[d.key])) };
}

// ---------------------------------------------------------------- sections

function statsWallHtml(reports: DossierReport[]): string {
  // Up to two stats per report (most relevant first), nine cards max.
  const cards: { stat: string; source: string }[] = [];
  for (const r of reports) {
    for (const stat of r.keyStats.slice(0, 2)) {
      cards.push({ stat, source: sourceLine(r) });
    }
  }
  const wall = cards.slice(0, 9);
  // No key_stats available (column missing or empty) — skip the wall, derive nothing.
  if (wall.length === 0) return "";

  const items = wall
    .map(({ stat, source }, i) => {
      const figure = statFigure(stat);
      const accent = ACCENTS[i % ACCENTS.length];
      return `      <div class="glass-sm stat-card">
        ${figure ? `<div class="stat-number" style="color: ${accent};">${esc(figure)}</div>` : ""}
        <p class="stat-body${figure ? "" : " stat-body-solo"}">${esc(stat)}</p>
        <p class="stat-source">${esc(source)}</p>
      </div>`;
    })
    .join("\n");

  return `  <section class="doc-section">
    <div class="kicker" style="color: var(--sky);">Het fundament</div>
    <h2>De cijfers in &eacute;&eacute;n oogopslag</h2>
    <div class="stat-grid">
${items}
    </div>
  </section>`;
}

function evidenceHtml(reports: DossierReport[]): string {
  const body =
    reports.length === 0
      ? `    <p class="muted-note">Er is nog geen sectorspecifiek onderzoek geladen voor deze sector en regio. Zodra de bibliotheek passende rapporten bevat, verschijnen ze hier automatisch.</p>`
      : reports
          .map((r, i) => {
            const englishNote =
              r.language && r.language !== "nl"
                ? `<span class="lang-note">samenvatting in het Engels</span>`
                : "";
            return `    <article class="glass report">
      <div class="kicker" style="color: ${ACCENTS[i % ACCENTS.length]};">Bron ${i + 1}</div>
      <h3><a href="${esc(r.url)}">${esc(r.title)}</a></h3>
      <p class="report-meta">${esc(sourceLine(r))} <span class="region-badge">${esc(regionLabel(r.region))}</span></p>
      <p class="report-excerpt">${englishNote}${esc(r.excerpt)}</p>
      <p class="report-link"><a href="${esc(r.url)}">${esc(r.url)}</a></p>
    </article>`;
          })
          .join("\n");

  return `  <section class="doc-section evidence">
    <div class="kicker" style="color: var(--rose);">Het bewijs</div>
    <h2>Wat het onderzoek laat zien</h2>
${body}
  </section>`;
}

function auditAxisHtml(title: string, a: AuditAxis & { imagesAnalysed?: number }): string {
  const pos = (a.lean + 100) / 2; // -100..100 → 0..100
  const evidence = a.evidence.length
    ? `      <ul class="audit-evidence">${a.evidence
        .slice(0, 3)
        .map((e) => `<li>${esc(e)}</li>`)
        .join("")}</ul>`
    : "";
  return `    <div class="glass-sm audit-axis">
      <div class="kicker" style="color: var(--sky);">${esc(title)}</div>
      <div class="stat-number" style="color: var(--ink); font-size: 2.4rem;">${a.inclusivity}%</div>
      <p class="stat-body">Inclusiviteit &middot; toon: <strong>${esc(a.leanLabel)}</strong></p>
      <div class="audit-bar"><span class="audit-marker" style="left: calc(${pos}% - 6px);"></span></div>
      <div class="audit-scale"><span>vrouwelijk</span><span>mannelijk</span></div>
      <p class="stat-body" style="margin-top: 12px;">${esc(a.summary)}</p>
${evidence}
    </div>`;
}

function auditHtml(client: string, audit: WebsiteAudit | null): string {
  if (!audit) return "";
  const pagesNote =
    audit.pages && audit.pages.length > 1
      ? `${audit.pages.length} pagina's`
      : "de homepage";
  return `  <section class="doc-section">
    <div class="kicker" style="color: var(--rose);">De communicatie-spiegel</div>
    <h2>Hoe ${esc(client)} nu communiceert</h2>
    <p class="section-intro">Automatische analyse van ${pagesNote} &mdash; de tekst &eacute;n de beelden &mdash; op inclusiviteit en de vrouwelijk&#8596;mannelijk-toon.</p>
    <div class="audit-grid">
${auditAxisHtml("Tekst", audit.text)}
${auditAxisHtml("Beeld", audit.visuals)}
    </div>
    ${audit.overall ? `<p class="audit-overall"><strong>Samengevat:</strong> ${esc(audit.overall)}</p>` : ""}
  </section>`;
}

function closingHtml(
  client: string,
  sector: string,
  scores: { merged: Record<DimensionKey, number>; overall: number } | null
): string {
  const vocab = sectorVocab(sector);
  let paragraphs: string;

  if (scores) {
    const band = bandFor(scores.overall);
    const lowest = [...DIMENSIONS]
      .sort((a, b) => scores.merged[a.key] - scores.merged[b.key])
      .slice(0, 2);
    const bandDesc = band.desc.charAt(0).toLowerCase() + band.desc.slice(1);
    paragraphs = `    <p>In de zelfscan staat ${esc(client)} vandaag op <strong style="color: ${band.color};">${scores.overall}%</strong> &mdash; band &ldquo;<strong>${esc(band.label)}</strong>&rdquo;: ${esc(bandDesc)}. De grootste ruimte zit in <strong>${esc(lowest[0].label)}</strong> (${scores.merged[lowest[0].key]}%) en <strong>${esc(lowest[1].label)}</strong> (${scores.merged[lowest[1].key]}%).</p>
    <p>Het onderzoek in dit dossier laat zien dat de ${esc(vocab.kloof)} geen abstract maatschappelijk gegeven is, maar een meetbaar verschil in ${esc(vocab.uitkomsten)} &mdash; met aanwijsbare momenten waarop dat verschil ontstaat. Precies op de twee dimensies hierboven liggen daarom de snelste, best onderbouwde stappen voor ${esc(client)}: daar komt het externe bewijs samen met de eigen uitgangspositie.</p>`;
  } else {
    paragraphs = `    <p>De zelfscan van het team loopt nog. Zodra de eerste resultaten binnen zijn, verbindt dit dossier het bewijs hierboven aan de eigen uitgangspositie van ${esc(client)}.</p>
    <p>Wat nu al vaststaat: de ${esc(vocab.kloof)} is meetbaar, structureel en be&iuml;nvloedbaar door keuzes die elke ${esc(vocab.instelling)} zelf in de hand heeft &mdash; in data, communicatie en proposities. De ${esc(vocab.instellingen)} die daar als eerste systematisch op sturen, bouwen een voorsprong op die moeilijk in te halen is.</p>`;
  }

  return `  <section class="doc-section">
    <div class="glass closing">
      <div class="kicker" style="color: var(--mint);">De vertaling</div>
      <h2>Wat dit betekent voor ${esc(client)}</h2>
${paragraphs}
    <p class="closing-promise">De Gender Capital Lab&trade; Sprint maakt dat concreet: <strong>&eacute;&eacute;n dag</strong> met het team aan tafel, en de ochtend erna ligt er een gekwantificeerde propositie.</p>
    </div>
  </section>`;
}

function footerHtml(reports: DossierReport[]): string {
  const sources =
    reports.length === 0
      ? `    <p class="muted-note">Nog geen bronnen gekoppeld aan deze sprint.</p>`
      : `    <ol class="source-list">
${reports
  .map(
    (r) =>
      `      <li>${esc(r.title)} &mdash; ${esc(sourceLine(r))} &mdash; <a href="${esc(r.url)}">${esc(r.url)}</a></li>`
  )
  .join("\n")}
    </ol>`;

  return `  <footer class="doc-footer doc-section">
    <p class="footer-brand">Unlockt &middot; Gender Capital Lab&trade; Sprint &middot; bronnenlijst</p>
${sources}
  </footer>`;
}

// Prism mark — copied verbatim from sprint/03_proposition-deck.html.
const PRISM_MARK = `<svg viewBox="0 0 420 150" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="pmFace" x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/>
            <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.45"/>
            <stop offset="1" stop-color="#ffffff" stop-opacity="0.7"/>
          </linearGradient>
          <linearGradient id="pmSide" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#0D3B2E" stop-opacity="0.34"/>
            <stop offset="1" stop-color="#0D3B2E" stop-opacity="0.08"/>
          </linearGradient>
          <linearGradient id="pmRose" gradientUnits="userSpaceOnUse" x1="168" y1="0" x2="402" y2="0">
            <stop offset="0" stop-color="#F5B896"/><stop offset="1" stop-color="#F5B896" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="pmAmber" gradientUnits="userSpaceOnUse" x1="176" y1="0" x2="406" y2="0">
            <stop offset="0" stop-color="#F2D080"/><stop offset="1" stop-color="#F2D080" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="pmMint" gradientUnits="userSpaceOnUse" x1="184" y1="0" x2="406" y2="0">
            <stop offset="0" stop-color="#9FD4B0"/><stop offset="1" stop-color="#9FD4B0" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="pmSky" gradientUnits="userSpaceOnUse" x1="191" y1="0" x2="400" y2="0">
            <stop offset="0" stop-color="#6DC0C8"/><stop offset="1" stop-color="#6DC0C8" stop-opacity="0"/>
          </linearGradient>
          <filter id="pmBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
        </defs>
        <!-- ground shadow -->
        <ellipse cx="152" cy="132" rx="62" ry="7" fill="#0D3B2E" opacity="0.14" filter="url(#pmBlur)"/>
        <!-- spectrum beams, emerging from behind the glass and fading out -->
        <polygon fill="url(#pmRose)"  points="168,57 168,63 402,33 402,21"/>
        <polygon fill="url(#pmAmber)" points="176,70 176,76 406,66 406,54"/>
        <polygon fill="url(#pmMint)"  points="184,83 184,89 406,99 406,87"/>
        <polygon fill="url(#pmSky)"   points="191,95 191,101 400,131 400,119"/>
        <!-- extruded side face (depth) -->
        <polygon fill="url(#pmSide)" points="150,16 166,7 220,103 204,114" stroke="rgba(255,255,255,0.5)" stroke-width="1" stroke-linejoin="round"/>
        <!-- front glass face -->
        <path d="M150,16 L204,114 L96,114 Z" fill="url(#pmFace)" stroke="rgba(255,255,255,0.9)" stroke-width="2" stroke-linejoin="round"/>
        <!-- highlight streak -->
        <line x1="143" y1="34" x2="116" y2="82" stroke="#ffffff" stroke-opacity="0.85" stroke-width="3" stroke-linecap="round"/>
      </svg>`;

// ------------------------------------------------------------------- build

/**
 * The complete dossier HTML for a sprint, or null when the sprint id is
 * unknown (the route turns that into a 404).
 */
export async function buildDossier(sprintId: string): Promise<string | null> {
  await ensureSchema();
  const c = db();

  const sprintRes = await c.execute({
    sql: "SELECT id, client, sprint_date, token, sector, region, website_audit_json FROM sprints WHERE id = ?",
    args: [sprintId],
  });
  if (sprintRes.rows.length === 0) return null;
  const sprint = sprintRes.rows[0];
  const client = String(sprint.client);
  const sector = sprint.sector == null ? "pensioen" : String(sprint.sector);
  const region = sprint.region == null ? "nl" : String(sprint.region);
  let audit: WebsiteAudit | null = null;
  if (sprint.website_audit_json != null) {
    try { audit = JSON.parse(String(sprint.website_audit_json)) as WebsiteAudit; } catch { audit = null; }
  }
  const sprintDate = formatDutchDate(
    sprint.sprint_date == null ? null : String(sprint.sprint_date)
  );

  const [reports, scores] = await Promise.all([
    fetchResearch(sector, region),
    fetchMergedScores(sprintId),
  ]);

  const metaLine = [
    esc(client),
    esc(sectorLabel(sector)),
    esc(regionLabel(region)),
    sprintDate ? `Sprint: ${esc(sprintDate)}` : "Sprintdatum volgt",
  ].join(" &middot; ");

  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Evidence dossier — ${esc(client)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
:root {
  --deep: #EAF6F1;
  --glass: rgba(255,255,255,0.55);
  --glass-border: rgba(255,255,255,0.85);
  --sky: #6DC0C8;
  --rose: #F5B896;
  --amber: #F2D080;
  --mint: #9FD4B0;
  --ink: #0D3B2E;
}

*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Inter', sans-serif;
  background: var(--deep);
  color: var(--ink);
  line-height: 1.6;
  position: relative;
}

/* Ambient standalone colour flares — global wash behind the document */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse 55vw 45vh at 10% 14%, rgba(109,192,200,0.55) 0%, rgba(109,192,200,0.14) 30%, transparent 58%),
    radial-gradient(ellipse 50vw 42vh at 92% 16%, rgba(245,184,150,0.48) 0%, rgba(245,184,150,0.12) 30%, transparent 58%),
    radial-gradient(ellipse 60vw 50vh at 88% 90%, rgba(242,208,128,0.42) 0%, rgba(242,208,128,0.11) 32%, transparent 60%),
    radial-gradient(ellipse 55vw 45vh at 10% 92%, rgba(159,212,176,0.52) 0%, rgba(159,212,176,0.13) 30%, transparent 58%);
  z-index: -2;
  pointer-events: none;
}

h1, h2, h3 { font-family: 'Sora', sans-serif; font-weight: 600; line-height: 1.2; }

.page {
  max-width: 880px;
  margin: 0 auto;
  padding: 64px 32px 80px;
}

/* Glass panel — layered refraction (Prism idiom) */
.glass, .glass-sm {
  position: relative;
  background: linear-gradient(160deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.48) 42%, rgba(255,255,255,0.38) 72%, rgba(255,255,255,0.55) 100%);
  backdrop-filter: blur(24px) saturate(1.25);
  -webkit-backdrop-filter: blur(24px) saturate(1.25);
  border: 1px solid rgba(255,255,255,0.9);
  border-radius: 24px;
  overflow: hidden;
}
.glass {
  padding: 36px 40px;
  box-shadow:
    inset 0 2px 0 rgba(255,255,255,1), inset 0 1px 1px rgba(255,255,255,0.9),
    inset 0 -2px 4px rgba(42,80,70,0.10),
    0 1px 2px rgba(42,80,70,0.08), 0 4px 8px rgba(42,80,70,0.06),
    0 12px 24px -8px rgba(42,80,70,0.14), 0 24px 48px -16px rgba(42,80,70,0.16);
}
.glass-sm {
  padding: 26px 28px;
  box-shadow:
    inset 0 2px 0 rgba(255,255,255,1), inset 0 1px 1px rgba(255,255,255,0.9),
    inset 0 -2px 4px rgba(42,80,70,0.10),
    0 1px 2px rgba(42,80,70,0.08), 0 3px 6px rgba(42,80,70,0.06),
    0 8px 18px -6px rgba(42,80,70,0.12), 0 18px 36px -12px rgba(42,80,70,0.14);
}
.glass::before, .glass-sm::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%);
  pointer-events: none;
  border-radius: inherit;
}

.kicker {
  font-family: 'Sora', sans-serif;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  margin-bottom: 12px;
}

a { color: var(--ink); }

/* ---------- cover ---------- */
.cover { margin-bottom: 56px; }
.prism-mark { margin: 0 0 8px -28px; }
.prism-mark svg { width: 320px; max-width: 100%; height: auto; display: block; }
.cover h1 { font-size: 2.8rem; font-weight: 700; margin-bottom: 14px; }
.cover-meta {
  font-family: 'Sora', sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  margin-bottom: 18px;
}
.cover-intro {
  font-size: 1.1rem;
  color: rgba(13,59,46,0.65);
  max-width: 620px;
  line-height: 1.7;
}

/* ---------- sections ---------- */
.doc-section { margin-bottom: 56px; }
.doc-section h2 { font-size: 1.7rem; margin-bottom: 24px; }
.audit-grid { display: flex; gap: 20px; flex-wrap: wrap; }
.audit-axis { flex: 1 1 300px; padding: 28px; }
.audit-bar { position: relative; height: 8px; border-radius: 4px; margin: 10px 0 5px;
  background: linear-gradient(90deg, var(--rose), #e7ecdf 50%, var(--sky)); }
.audit-marker { position: absolute; top: -3px; width: 12px; height: 14px; border-radius: 3px;
  background: var(--ink); box-shadow: 0 1px 3px rgba(13,59,46,0.35); }
.audit-scale { display: flex; justify-content: space-between; font-size: 0.72rem; color: rgba(13,59,46,0.5); }
.audit-evidence { margin: 6px 0 0 18px; }
.audit-evidence li { font-size: 0.85rem; color: rgba(13,59,46,0.6); line-height: 1.5; margin-bottom: 4px; }
.audit-overall { margin-top: 18px; line-height: 1.7; }

/* ---------- stats wall ---------- */
.stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.stat-card { display: flex; flex-direction: column; }
.stat-number {
  font-family: 'Sora', sans-serif;
  font-size: 2.1rem;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 12px;
}
.stat-body { font-size: 0.88rem; color: rgba(13,59,46,0.75); line-height: 1.55; }
.stat-body-solo { font-family: 'Sora', sans-serif; font-size: 1rem; font-weight: 600; color: var(--ink); }
.stat-source {
  margin-top: auto;
  padding-top: 14px;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: rgba(13,59,46,0.45);
}

/* ---------- evidence ---------- */
.report { margin-bottom: 24px; }
.report h3 { font-size: 1.2rem; margin-bottom: 6px; }
.report h3 a { color: var(--ink); text-decoration: none; }
.report h3 a:hover { text-decoration: underline; }
.region-badge {
  display: inline-block;
  font-family: 'Sora', sans-serif;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(13,59,46,0.6);
  background: rgba(109,192,200,0.22);
  border-radius: 6px;
  padding: 2px 8px;
  margin-left: 8px;
  vertical-align: 1px;
}
.report-meta {
  font-family: 'Sora', sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba(13,59,46,0.55);
  margin-bottom: 14px;
}
.report-excerpt { font-size: 0.95rem; color: rgba(13,59,46,0.8); line-height: 1.7; margin-bottom: 14px; }
.lang-note {
  display: inline-block;
  font-family: 'Sora', sans-serif;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #8a6d3b;
  background: rgba(242,208,128,0.3);
  border-radius: 6px;
  padding: 2px 8px;
  margin-right: 10px;
  vertical-align: 2px;
}
.report-link { font-size: 0.82rem; word-break: break-all; }
.report-link a { color: rgba(13,59,46,0.6); }

/* ---------- closing ---------- */
.closing h2 { margin-bottom: 18px; }
.closing p { font-size: 1.02rem; line-height: 1.75; }
.closing p + p { margin-top: 14px; }
.closing-promise { font-family: 'Sora', sans-serif; font-weight: 500; }

/* ---------- footer ---------- */
.doc-footer {
  border-top: 1px solid rgba(13,59,46,0.15);
  padding-top: 28px;
  margin-bottom: 0;
}
.footer-brand {
  font-family: 'Sora', sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(13,59,46,0.45);
  margin-bottom: 18px;
}
.source-list { padding-left: 22px; }
.source-list li {
  font-size: 0.82rem;
  color: rgba(13,59,46,0.65);
  line-height: 1.6;
  margin-bottom: 8px;
  word-break: break-word;
}
.source-list a { color: rgba(13,59,46,0.55); }

.muted-note { color: rgba(13,59,46,0.55); font-size: 0.95rem; }

/* ---------- print ---------- */
@page { margin: 16mm; }
@media print {
  body { background: #fff; }
  body::before { display: none; }
  .page { max-width: none; padding: 0; }
  .glass, .glass-sm {
    background: #fff;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    box-shadow: none;
    border: 1px solid rgba(13,59,46,0.18);
  }
  .glass::before, .glass-sm::before { display: none; }
  .cover { margin-bottom: 36px; }
  .doc-section { margin-bottom: 36px; }
  h2, h3 { break-after: avoid; }
  .stat-card, .report, .closing { break-inside: avoid; }
  .evidence { break-before: page; }
  .doc-footer { break-inside: avoid; }
  a { text-decoration: none; }
}

@media (max-width: 720px) {
  .page { padding: 40px 20px 56px; }
  .cover h1 { font-size: 2.1rem; }
  .stat-grid { grid-template-columns: 1fr; }
  .prism-mark { margin-left: -16px; }
}
</style>
</head>
<body>
<div class="page">
  <header class="cover">
    <div class="prism-mark" aria-hidden="true">
      ${PRISM_MARK}
    </div>
    <div class="kicker" style="color: rgba(13,59,46,0.45);">Unlockt &middot; Gender Capital Lab&trade; Sprint</div>
    <h1>Evidence dossier</h1>
    <p class="cover-meta">${metaLine}</p>
    <p class="cover-intro">Dit dossier is het feitenfundament onder de sprint: het externe onderzoek, de cijfers die ertoe doen en wat ze betekenen voor ${esc(client)}.</p>
  </header>

${statsWallHtml(reports)}

${evidenceHtml(reports)}

${auditHtml(client, audit)}

${closingHtml(client, sector, scores)}

${footerHtml(reports)}
</div>
</body>
</html>
`;
}
