import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import Ring from "@/components/Ring";
import SprintNav from "@/components/SprintNav";
import ResearchTrigger from "@/components/ResearchTrigger";
import WebsiteAudit from "@/components/WebsiteAudit";
import type { WebsiteAudit as WebsiteAuditType } from "@/lib/website-audit";
import PrereadTrigger from "@/components/PrereadTrigger";
import type { PrereadDoc } from "@/lib/preread";
import { db, ensureSchema } from "@/lib/db";
import { formatDutchDate } from "@/lib/dates";
import { regionLabel, relevantRegions, sectorLabel } from "@/lib/sectors";
import {
  BAND_LEGEND,
  DIMENSIONS,
  bandFor,
  mergePcts,
  overallPct,
  type DimensionKey,
} from "@/lib/scoring";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------- markdown
// Tiny renderer for the deep-research brief: ## / ### headings, - lists,
// **bold**, [text](url) links, bare URLs, paragraphs. No dependencies — the
// brief is our own constrained output, not arbitrary markdown.

const INLINE_RE =
  /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|(https?:\/\/[^\s)<>,]+)/g;

function renderInline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(INLINE_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) nodes.push(text.slice(last, idx));
    if (m[1] !== undefined) {
      nodes.push(
        <a key={`${keyBase}-${k++}`} href={m[2]} target="_blank" rel="noopener noreferrer">
          {m[1]}
        </a>
      );
    } else if (m[3] !== undefined) {
      nodes.push(<strong key={`${keyBase}-${k++}`}>{m[3]}</strong>);
    } else {
      nodes.push(
        <a key={`${keyBase}-${k++}`} href={m[4]} target="_blank" rel="noopener noreferrer">
          {m[4]}
        </a>
      );
    }
    last = idx + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

const LIST_ITEM_RE = /^(?:[-*]|\d+\.)\s+/;

function MarkdownBrief({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let para: string[] = [];
  let key = 0;

  const flushList = () => {
    if (list.length === 0) return;
    blocks.push(
      <ul key={`b${key++}`} style={{ margin: "0 0 16px 22px", lineHeight: 1.7 }}>
        {list.map((item, i) => (
          <li key={i} style={{ marginBottom: 6 }}>{renderInline(item, `li${key}-${i}`)}</li>
        ))}
      </ul>
    );
    list = [];
  };
  const flushPara = () => {
    if (para.length === 0) return;
    blocks.push(
      <p key={`b${key++}`} style={{ marginBottom: 14, lineHeight: 1.7 }}>
        {renderInline(para.join(" "), `p${key}`)}
      </p>
    );
    para = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (line === "") {
      flushList();
      flushPara();
    } else if (line.startsWith("### ")) {
      flushList();
      flushPara();
      blocks.push(
        <h4 key={`b${key++}`} style={{ fontFamily: "'Sora', sans-serif", fontSize: "1rem", margin: "20px 0 8px" }}>
          {renderInline(line.slice(4), `h4-${key}`)}
        </h4>
      );
    } else if (line.startsWith("## ")) {
      flushList();
      flushPara();
      blocks.push(
        <h3 key={`b${key++}`} style={{ fontFamily: "'Sora', sans-serif", fontSize: "1.15rem", margin: "28px 0 10px" }}>
          {renderInline(line.slice(3), `h3-${key}`)}
        </h3>
      );
    } else if (LIST_ITEM_RE.test(line)) {
      flushPara();
      list.push(line.replace(LIST_ITEM_RE, ""));
    } else {
      flushList();
      para.push(line);
    }
  }
  flushList();
  flushPara();
  return <div>{blocks}</div>;
}

// ---------------------------------------------------------------- helpers

/** Lenient JSON-array-of-strings parse (same tolerance as lib/library.ts). */
function parseStringArray(raw: unknown): string[] {
  if (raw == null) return [];
  try {
    const parsed = JSON.parse(String(raw));
    if (!Array.isArray(parsed)) return [];
    return parsed.map((s) => String(s).trim()).filter(Boolean);
  } catch {
    return [];
  }
}

interface Interview {
  completedAt: string | null;
  summary: string | null;
  highlights: string[];
}

function parseInterview(raw: unknown): Interview | null {
  if (raw == null) return null;
  try {
    const p = JSON.parse(String(raw)) as Record<string, unknown>;
    return {
      completedAt: typeof p.completedAt === "string" ? p.completedAt : null,
      summary: typeof p.summary === "string" ? p.summary : null,
      highlights: Array.isArray(p.highlights)
        ? p.highlights.filter((h): h is string => typeof h === "string" && h.trim() !== "")
        : [],
    };
  } catch {
    return null;
  }
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** The fixed closing card — also serves as the pre-read agenda block. */
function GoalOfTheDay({ kickerColor = "var(--mint)" }: { kickerColor?: string }) {
  const rows: [string, string][] = [
    ["By 17:00", "3–5 testable, AI-built propositions — each a different moment × mechanism."],
    ["Tonight", "Tested with 6–8 women from the target group."],
    ["Tomorrow 09:00", "Pick the pilot on evidence."],
  ];
  return (
    <section className="glass" aria-label="The goal of the day">
      <div className="kicker" style={{ color: kickerColor }}>The goal of the day</div>
      <h2 style={{ fontSize: "1.4rem", marginBottom: 20 }}>
        One day. Built, tested, decided.
      </h2>
      <div style={{ display: "grid", gap: 14 }}>
        {rows.map(([when, what]) => (
          <div key={when} style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 16, alignItems: "baseline" }}>
            <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>{when}</span>
            <span style={{ lineHeight: 1.6 }}>{what}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const PRINT_CSS = `
@media print {
  body { background: #fff !important; }
  .site-header, .site-footer, .no-print, .btn, button { display: none !important; }
  .page { padding: 0 !important; max-width: none !important; }
  .glass, .glass-sm {
    background: #fff !important;
    box-shadow: none !important;
    border: 1px solid #ddd !important;
    break-inside: avoid;
  }
  .glass::before, .glass-sm::before { display: none !important; }
  a { color: inherit !important; text-decoration: none !important; }
}
`;

// ---------------------------------------------------------------- page

export default async function FindingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preread?: string }>;
}) {
  const { id } = await params;
  const { preread: prereadRaw } = await searchParams;
  const preread = prereadRaw === "1";

  await ensureSchema();
  const c = db();

  const sprintRes = await c.execute({
    sql: `SELECT id, client, sprint_date, sector, region, website, research_brief, research_brief_at,
                 preread_json, preread_at, website_audit_json
          FROM sprints WHERE id = ?`,
    args: [id],
  });
  if (sprintRes.rows.length === 0) notFound();
  const sprint = sprintRes.rows[0];
  const client = String(sprint.client);
  const sector = sprint.sector == null ? "pensioen" : String(sprint.sector);
  const region = sprint.region == null ? "nl" : String(sprint.region);
  const sprintDate = formatDutchDate(
    sprint.sprint_date == null ? null : String(sprint.sprint_date)
  );
  const brief = sprint.research_brief == null ? null : String(sprint.research_brief);
  const briefAt = sprint.research_brief_at == null ? null : String(sprint.research_brief_at);
  let websiteAudit: WebsiteAuditType | null = null;
  if (sprint.website_audit_json != null) {
    try { websiteAudit = JSON.parse(String(sprint.website_audit_json)) as WebsiteAuditType; } catch { websiteAudit = null; }
  }
  const aiEnabled = Boolean(process.env.ANTHROPIC_API_KEY);

  // ---- readiness: identical math to the dashboard (merge → overall → band)
  const rowsRes = await c.execute({
    sql: `SELECT p.id, p.name, p.role, p.prework, p.interview_json,
                 s.mens_organisatie, s.data, s.marketing_communicatie,
                 s.ecosystemen, s.proposities, s.overall
          FROM participants p
          LEFT JOIN assessments a ON a.participant_id = p.id
          LEFT JOIN scores s ON s.assessment_id = a.id
          WHERE p.sprint_id = ?
          ORDER BY p.created_at ASC`,
    args: [id],
  });
  const participants = rowsRes.rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    role: r.role == null ? null : String(r.role),
    prework: r.prework == null ? null : String(r.prework),
    interview: parseInterview(r.interview_json),
    scores:
      r.overall == null
        ? null
        : (Object.fromEntries(
            DIMENSIONS.map((d) => [d.key, Number(r[d.key])])
          ) as Record<DimensionKey, number>),
  }));

  const scored = participants.filter(
    (p): p is (typeof participants)[number] & { scores: Record<DimensionKey, number> } =>
      p.scores !== null
  );
  const merged =
    scored.length > 0
      ? (Object.fromEntries(
          DIMENSIONS.map((d) => [d.key, mergePcts(scored.map((p) => p.scores[d.key]))])
        ) as Record<DimensionKey, number>)
      : null;
  const mergedOverall = merged ? overallPct(DIMENSIONS.map((d) => merged[d.key])) : null;
  const mergedBand = mergedOverall === null ? null : bandFor(mergedOverall);

  const lowestTwo = merged
    ? [...DIMENSIONS].sort((a, b) => merged[a.key] - merged[b.key]).slice(0, 2)
    : [];

  const disagreements =
    scored.length >= 2
      ? DIMENSIONS.map((d) => {
          const values = scored.map((p) => p.scores[d.key]);
          return { dim: d, spread: Math.max(...values) - Math.min(...values) };
        }).filter((x) => x.spread >= 25)
      : [];

  const interviewed = participants.filter(
    (p) => p.interview !== null && p.interview.highlights.length > 0
  );

  // ---- data room: analyzed uploads
  const docsRes = await c.execute({
    sql: `SELECT id, filename, excerpt, key_stats, relevance, status
          FROM documents WHERE sprint_id = ? ORDER BY created_at ASC`,
    args: [id],
  });
  const documents = docsRes.rows
    .map((r) => ({
      id: String(r.id),
      filename: String(r.filename),
      excerpt: r.excerpt == null ? null : String(r.excerpt),
      keyStats: parseStringArray(r.key_stats),
      relevance: r.relevance == null ? null : String(r.relevance),
      status: r.status == null ? null : String(r.status),
    }))
    .filter((d) => d.status === "analyzed" && d.excerpt);

  // ---- evidence base: library reports for sector (+ cross-sector) and region
  const regions = relevantRegions(region);
  const libraryRes = await c.execute({
    sql: `SELECT id, title, organization, year, url, key_stats
          FROM research_reports
          WHERE sector IN (?, 'algemeen')
            AND region IN (${regions.map(() => "?").join(", ")})
          ORDER BY CASE WHEN region = ? THEN 0 ELSE 1 END, year DESC, title ASC`,
    args: [sector, ...regions, region],
  });
  const reports = libraryRes.rows.map((r) => ({
    id: String(r.id),
    title: String(r.title),
    organization: r.organization == null ? null : String(r.organization),
    year: r.year == null ? null : Number(r.year),
    url: String(r.url),
    keyStats: parseStringArray(r.key_stats),
  }));

  const meta = (
    <p className="intro-note" style={{ marginBottom: 8 }}>
      {sectorLabel(sector)} · {regionLabel(region)}
      {" · "}
      {sprintDate ? `Sprint day: ${sprintDate}` : "Sprint day: not set"}
    </p>
  );

  // ================================================================ pre-read
  // The pre-read is the one artifact that is SENT to the client crew (T–1,
  // 17:00) — so it's a polished, AI-composed DUTCH document. Until composed,
  // the facilitator sees a prompt to generate it.
  if (preread) {
    let prereadDoc: PrereadDoc | null = null;
    try {
      prereadDoc = sprint.preread_json == null ? null : (JSON.parse(String(sprint.preread_json)) as PrereadDoc);
    } catch {
      prereadDoc = null;
    }
    const prereadAt = sprint.preread_at == null ? null : String(sprint.preread_at);

    const AGENDA: [string, string][] = [
      ["09:00", "De spiegel — wat we in jullie cijfers, documenten en gesprekken vonden"],
      ["10:00", "Het doel van de dag"],
      ["10:30", "Discovery — de doelgroep, de drempels, de kansen"],
      ["12:30", "Ideeën — we kiezen 3–5 concepten"],
      ["14:00", "Bouwen — elk concept wordt met AI een klikbaar prototype"],
      ["18:00", "Testen — 6–8 vrouwen uit de doelgroep geven hun oordeel"],
      ["Dag 2 · 09:00", "De uitslag — en de beslissing welk concept de pilot wordt"],
    ];

    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
        <div className="page-label">Pre-read · {client}</div>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 700, marginBottom: 8 }}>
          Morgen houden we {client} de spiegel voor.
        </h1>
        <p className="intro-note" style={{ marginBottom: 8 }}>
          {sectorLabel(sector)} · {regionLabel(region)}
          {sprintDate ? ` · sprintdag ${sprintDate}` : ""}
        </p>
        <p className="muted small no-print" style={{ marginBottom: 20 }}>
          <Link href={`/dashboard/${id}/findings`} className="muted">← Full findings</Link>
          {" · "}
          <Link href={`/dashboard/${id}`} className="muted">Dashboard</Link>
          {" · print this page or save as PDF to send to the crew"}
        </p>
        <PrereadTrigger sprintId={id} hasDoc={prereadDoc !== null} docAt={prereadAt} enabled={aiEnabled} />

        {prereadDoc ? (
          <>
            <section className="glass" style={{ marginBottom: 28 }} aria-label="Introductie">
              <p style={{ fontSize: "1.08rem", lineHeight: 1.8, marginBottom: 0 }}>{prereadDoc.intro}</p>
            </section>

            <section className="glass" style={{ marginBottom: 28 }} aria-label="Waar het team staat">
              <div className="kicker" style={{ color: "var(--sky)" }}>Waar het team staat</div>
              {merged && mergedOverall !== null && mergedBand && (
                <div style={{ display: "flex", gap: 36, alignItems: "center", flexWrap: "wrap", margin: "8px 0 18px" }}>
                  <Ring pct={mergedOverall} size={120} />
                  <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "1.15rem", color: mergedBand.color, marginBottom: 0 }}>
                    {mergedBand.label}
                  </p>
                </div>
              )}
              <p style={{ lineHeight: 1.8, marginBottom: 10 }}>{prereadDoc.reflectie}</p>
              <p className="muted small" style={{ marginBottom: 0 }}>
                Het volledige beeld — wie wat zei, en waar jullie het onderling oneens zijn — bewaren we voor morgenochtend.
              </p>
            </section>

            <section className="glass" style={{ marginBottom: 28 }} aria-label="Drie dingen die ons opvielen">
              <div className="kicker" style={{ color: "var(--rose)" }}>Drie dingen die ons opvielen</div>
              {prereadDoc.teasers.map((t, i) => (
                <div key={i} style={{ margin: "16px 0", paddingLeft: 18, borderLeft: "3px solid var(--rose)" }}>
                  <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, marginBottom: 4 }}>{t.kop}</p>
                  <p style={{ lineHeight: 1.7, marginBottom: 0 }}>{t.zin}</p>
                </div>
              ))}
            </section>

            <section className="glass" style={{ marginBottom: 28 }} aria-label="Het programma">
              <div className="kicker" style={{ color: "var(--mint)" }}>Het programma van morgen</div>
              <ul style={{ listStyle: "none", margin: "8px 0 18px", padding: 0 }}>
                {AGENDA.map(([time, item]) => (
                  <li key={time} style={{ display: "flex", gap: 16, padding: "7px 0", borderBottom: "1px solid rgba(13,59,46,0.08)" }}>
                    <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, whiteSpace: "nowrap", minWidth: 92 }}>{time}</span>
                    <span style={{ lineHeight: 1.6 }}>{item}</span>
                  </li>
                ))}
              </ul>
              <p style={{ lineHeight: 1.8, marginBottom: 0 }}>{prereadDoc.avond}</p>
            </section>

            <section className="glass-sm" aria-label="Tot morgen">
              <p style={{ fontSize: "1.05rem", lineHeight: 1.8, marginBottom: 6 }}>{prereadDoc.afsluiting}</p>
              <p className="muted small" style={{ marginBottom: 0 }}>Unlockt · Gender Capital Lab™ Sprint</p>
            </section>
          </>
        ) : (
          <section className="glass" aria-label="Nog niet samengesteld">
            <div className="kicker" style={{ color: "var(--amber)" }}>Not composed yet</div>
            <p style={{ marginBottom: 0 }}>
              The pre-read is the Dutch teaser document the crew receives at
              T–1, 17:00 — composed by AI from this sprint&rsquo;s own scores
              and research hooks. Run the deep research first (on the full
              findings page), then hit <strong>Compose pre-read</strong> above.
            </p>
          </section>
        )}
      </>
    );
  }

  // ================================================================ full page
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <div className="page-label">Facilitator · Sprint findings</div>
      <h1 style={{ fontSize: "2.4rem", fontWeight: 700, marginBottom: 8 }}>{client}</h1>
      {meta}
      <SprintNav sprintId={id} active="findings" />
      <p className="muted small no-print" style={{ marginBottom: 36 }}>
        <Link href={`/dashboard/${id}/findings?preread=1`} className="muted">
          Pre-read version →
        </Link>
      </p>

      {/* ---------- 1 · Readiness ---------- */}
      <section className="glass" style={{ marginBottom: 36 }} aria-label="Readiness">
        <div className="kicker" style={{ color: "var(--sky)" }}>1 · Readiness</div>
        <h2 style={{ fontSize: "1.6rem", marginBottom: 28 }}>
          The room&rsquo;s combined picture.
        </h2>
        {merged && mergedOverall !== null && mergedBand ? (
          <>
            <div className="results-grid">
              {DIMENSIONS.map((dim) => (
                <div className="glass-sm result-card" key={dim.key}>
                  <Ring pct={merged[dim.key]} label={dim.label} size={92} />
                </div>
              ))}
            </div>
            <div className="overall-wrap">
              <Ring pct={mergedOverall} size={160} />
              <p className="grade-dim"><strong>Overall</strong></p>
              <p className="overall-band" style={{ color: mergedBand.color }}>
                {mergedBand.label}
              </p>
              <p className="overall-band-desc">{mergedBand.desc}</p>
              <p className="band-legend">{BAND_LEGEND}</p>
            </div>

            <div style={{ marginTop: 28 }}>
              <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, marginBottom: 8 }}>
                Where the day should aim
              </p>
              <p style={{ lineHeight: 1.7, marginBottom: 18 }}>
                {lowestTwo.map((d, i) => (
                  <span key={d.key}>
                    {i > 0 ? " and " : ""}
                    <strong>{d.label}</strong> ({merged[d.key]}%)
                  </span>
                ))}{" "}
                score lowest — that&rsquo;s where the biggest unlock sits, and
                where the propositions should land.
              </p>
              {scored.length >= 2 ? (
                disagreements.length > 0 ? (
                  disagreements.map(({ dim, spread }) => (
                    <p key={dim.key} style={{ marginBottom: 8 }}>
                      <span className="spread-flag">
                        {dim.label} — spread {spread} pts: the room disagrees here
                        — that&rsquo;s where the conversation is
                      </span>
                    </p>
                  ))
                ) : (
                  <p className="muted small">
                    No major divergence — the room broadly agrees across all
                    five dimensions.
                  </p>
                )
              ) : (
                <p className="muted small">
                  Divergence appears once at least two assessments are in.
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="muted">
            No assessments in yet — the merged rings, the two lowest dimensions
            and the room&rsquo;s disagreements appear here as soon as the first
            self-assessment lands. Share the intake link from the dashboard.
          </p>
        )}
      </section>

      {/* ---------- 2 · Voices ---------- */}
      <section className="glass-sm" style={{ marginBottom: 36 }} aria-label="Voices from your own crew">
        <div className="kicker" style={{ color: "var(--rose)" }}>2 · Voices from your own crew</div>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 6 }}>
          What they told us, in their own words.
        </h2>
        <p className="muted small" style={{ marginBottom: 18 }}>
          Verbatim quotes from the AI intake interviews — internal page, nothing
          anonymised.
        </p>
        {interviewed.length === 0 ? (
          <p className="muted">
            No intake interviews completed yet — when participants finish the AI
            interview, their sharpest quotes appear here as pull-quotes,
            alongside their pre-work answers.
          </p>
        ) : (
          interviewed.map((p) => (
            <div key={p.id} style={{ marginBottom: 28 }}>
              <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
                {firstName(p.name)}
                {p.role ? (
                  <span className="muted" style={{ fontWeight: 400 }}> · {p.role}</span>
                ) : null}
              </p>
              {p.interview!.highlights.slice(0, 2).map((quote, i) => (
                <p className="prework-quote" key={i} style={{ marginBottom: 10 }}>
                  &ldquo;{quote}&rdquo;
                </p>
              ))}
              {p.prework ? (
                <p className="muted small" style={{ marginTop: 8, lineHeight: 1.6 }}>
                  Pre-work — &ldquo;where is money being left on the table?&rdquo;:{" "}
                  {p.prework}
                </p>
              ) : null}
            </div>
          ))
        )}
      </section>

      {/* ---------- 3 · Data room ---------- */}
      <section className="glass-sm" style={{ marginBottom: 36 }} aria-label="The data room speaks">
        <div className="kicker" style={{ color: "var(--amber)" }}>3 · The data room speaks</div>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 6 }}>
          What the client&rsquo;s own documents reveal.
        </h2>
        <p className="muted small" style={{ marginBottom: 18 }}>
          AI-analyzed uploads — excerpts and the numbers worth quoting back.
        </p>
        {documents.length === 0 ? (
          <p className="muted">
            No analyzed documents yet — upload the client&rsquo;s own reports,
            board packs or data extracts in the data room and their key numbers
            land here.
          </p>
        ) : (
          documents.map((d) => (
            <div key={d.id} style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{d.filename}</p>
              {d.relevance ? (
                <p className="muted small" style={{ marginTop: 2 }}>{d.relevance}</p>
              ) : null}
              <p className="prework-quote" style={{ fontStyle: "normal" }}>{d.excerpt}</p>
              {d.keyStats.length > 0 ? (
                <p style={{ marginTop: 10, marginBottom: 0 }}>
                  {d.keyStats.map((s, i) => (
                    <span className="stat-chip" key={i}>{s}</span>
                  ))}
                </p>
              ) : null}
            </div>
          ))
        )}
      </section>

      {/* ---------- 4 · Market, media & competitors ---------- */}
      <section className="glass-sm" style={{ marginBottom: 36 }} aria-label="Market media and competitors">
        <div className="kicker" style={{ color: "var(--sky)" }}>4 · Markt, media &amp; concurrenten</div>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 6 }}>
          What the outside world says about {client}.
        </h2>
        <p className="muted small" style={{ marginBottom: 18 }}>
          Auto-collected at sprint creation: company snapshot, the
          inclusive-finance angle, recent media coverage, competitor best
          practices and the hooks for the morning. Recent reports land in the
          evidence base below.
        </p>
        <ResearchTrigger
          sprintId={id}
          hasBrief={brief !== null}
          briefAt={briefAt}
          enabled={aiEnabled}
        />
        {brief ? (
          <MarkdownBrief text={brief} />
        ) : (
          <p className="muted" style={{ marginBottom: 0 }}>
            No deep-research brief yet — run it above. It searches the public
            web for the client, their inclusive-finance track record and
            competitor best practices, and writes the full brief into this
            section (≈2–3 minutes).
          </p>
        )}
      </section>

      {/* ---------- 4b · Website audit ---------- */}
      <section className="glass-sm" style={{ marginBottom: 36 }} aria-label="Website text and visuals">
        <div className="kicker" style={{ color: "var(--rose)" }}>Website — tekst &amp; beeld</div>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 6 }}>
          Hoe inclusief, vrouwelijk of mannelijk communiceert {client}?
        </h2>
        <p className="muted small" style={{ marginBottom: 18 }}>
          Automatische analyse van de homepage — de tekst én de beelden — op
          inclusiviteit en de vrouwelijk↔mannelijk-toon. Verzameld bij het aanmaken van de sprint.
        </p>
        {websiteAudit ? (
          <WebsiteAudit audit={websiteAudit} />
        ) : (
          <p className="muted" style={{ marginBottom: 0 }}>
            Nog geen website-analyse. Zet een website op de sprint en verzamel de
            intel opnieuw via het <Link href={`/dashboard/${id}`}>overzicht</Link>.
          </p>
        )}
      </section>

      {/* ---------- 5 · Evidence base ---------- */}
      <section className="glass-sm" style={{ marginBottom: 36 }} aria-label="The evidence base">
        <div className="kicker" style={{ color: "var(--mint)" }}>5 · The evidence base</div>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 6 }}>
          The research behind the day.
        </h2>
        <p className="muted small" style={{ marginBottom: 18 }}>
          Library reports matching {sectorLabel(sector)} (+ cross-sector) in{" "}
          {regions.map((r) => regionLabel(r)).join(" / ")} — most specific first.
        </p>
        {reports.length === 0 ? (
          <p className="muted">
            No matching reports yet — add sector or cross-sector evidence in the{" "}
            <Link href="/research">research library</Link> and it shows up here
            with its key stats.
          </p>
        ) : (
          reports.map((r) => (
            <div key={r.id} style={{ marginBottom: 22 }}>
              <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
                <a href={r.url} target="_blank" rel="noopener noreferrer">
                  {r.title} ↗
                </a>
              </p>
              <p className="muted small">
                {r.organization ?? "Unknown organization"}
                {r.year !== null ? ` · ${r.year}` : ""}
              </p>
              {r.keyStats.length > 0 ? (
                <p style={{ marginTop: 8, marginBottom: 0 }}>
                  {r.keyStats.map((s, i) => (
                    <span className="stat-chip" key={i}>{s}</span>
                  ))}
                </p>
              ) : null}
            </div>
          ))
        )}
      </section>

      {/* ---------- 6 · Goal of the day ---------- */}
      <GoalOfTheDay />
    </>
  );
}
