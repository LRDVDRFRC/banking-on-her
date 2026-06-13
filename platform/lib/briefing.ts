// Diagnose briefing — the facilitator's prep document for the sprint day.
// Deterministic: every word is assembled from sprint data, the band the room
// lands in, and the sector vocabulary. No AI calls — this must work in the
// basement, the train and five minutes before the 09:00 kick-off.
//
// English UI (internal facilitator material); Dutch domain terms (kloof,
// deelnemers, …) are kept verbatim because that's how the room talks.
// Query patterns mirror app/dashboard/[id]/page.tsx (merged percentages,
// research matching) — deliberately copied, not imported, so this module
// stays independent of the page components.

import { db, ensureSchema } from "@/lib/db";
import { formatDutchDate } from "@/lib/dates";
import {
  regionLabel,
  relevantRegions,
  sectorLabel,
  sectorVocab,
  type SectorVocab,
} from "@/lib/sectors";
import {
  DIMENSIONS,
  bandFor,
  mergePcts,
  overallPct,
  type Band,
  type DimensionKey,
} from "@/lib/scoring";

// ------------------------------------------------------------------ types

export interface BriefingDimension {
  key: DimensionKey;
  label: string;
  pct: number;
  band: Band;
  /** ~2-sentence facilitator note: what this score means for the day. */
  narrative: string;
  /** True for the two lowest dimensions — the sprint focus. */
  isFocus: boolean;
}

export interface BriefingDivergence {
  key: DimensionKey;
  label: string;
  low: { name: string; pct: number };
  high: { name: string; pct: number };
  spread: number;
  /** Spread ≥ 25 — worth naming out loud in the room. */
  flagged: boolean;
  flagLine: string | null;
}

export interface BriefingVoice {
  name: string;
  role: string | null;
  quote: string;
}

export interface BriefingEvidence {
  id: string;
  title: string;
  organization: string | null;
  year: number | null;
  url: string;
  /** key_stats flattened — the numbers to have on screen at the reveal. */
  keyStats: string[];
}

export interface Briefing {
  sprint: {
    id: string;
    client: string;
    sector: string;
    sectorLabel: string;
    region: string;
    regionLabel: string;
    /** Dutch-formatted sprint date, or null when not set. */
    date: string | null;
    participantCount: number;
    assessmentCount: number;
  };
  /** Five dimensions in canonical order; empty when no assessments yet. */
  dimensions: BriefingDimension[];
  overall: { pct: number; band: Band } | null;
  /** The two lowest dimensions, lowest first; empty when no assessments. */
  focus: BriefingDimension[];
  /** One row per dimension; empty until at least two assessments are in. */
  divergence: BriefingDivergence[];
  voices: BriefingVoice[];
  /** Participants who registered but left the pre-work question empty. */
  preworkSkipped: number;
  /** Dutch draft sprint mandate — explicitly a draft, the room rewrites it. */
  draftMandate: string;
  /** Top 5 matched research reports — same matching as the dashboard. */
  evidence: BriefingEvidence[];
  /** Three numbered steps for running the 11:00 reveal. */
  revealScript: string[];
}

// ------------------------------------------------------- narrative engine

export const DIVERGENCE_THRESHOLD = 25;

const FLAG_LINE =
  "the room disagrees here — that's where the conversation is";

type BandLabel = "blinde vlek" | "latent" | "in opbouw" | "koploper";

/**
 * Facilitator notes per dimension theme × readiness band. English prose,
 * Dutch domain vocabulary via lowercase {tokens} resolved against the
 * sprint's sector. ~2 sentences each: what the score means, and what to do
 * with it in the room.
 */
const NARRATIVES: Record<DimensionKey, Record<BandLabel, string>> = {
  mens_organisatie: {
    "blinde vlek":
      "Nobody in this organisation owns the {kloof} yet — expect the gap number itself to land as news on the day. Spend the morning making it personal: ask early whose KPI this could live in, and get the board-level commercial question on the table before lunch.",
    latent:
      "Someone clearly cares, but ownership is informal — the {kloof} lives in values statements, not in anyone's targets. Push for a named owner and one concrete KPI before the mandate discussion; it's the cheapest win of the day.",
    "in opbouw":
      "Ownership and gender-aware decision checks exist in parts of the organisation, so don't re-sell the problem. Use the session to connect the existing owners to the commercial case and to lock the {kloof} into next year's targets.",
    koploper:
      "Leadership already treats the {kloof} as a commercial topic, so the room will be impatient with basics. Skip persuasion, go straight to where incentives still don't bite, and let them stress-test the draft mandate hard.",
  },
  data: {
    "blinde vlek":
      "Assume no gender split of the {klanten} base exists today — the room cannot yet see the {kloof} in its own numbers. Lead with the external benchmark figures below; they will have to stand in for internal data all day.",
    latent:
      "There are pockets of {klant} data analysis, but gender is not yet a systematic lens — the opportunity map will mostly be built live in the room. Ask early who could actually pull a gender × age split, and give them that task before lunch.",
    "in opbouw":
      "Gender splits exist and are measured, but they don't yet steer decisions — the data people will know the {kloof} number even if leadership doesn't. Get their internal figures on screen next to the external evidence and ask why nothing has moved.",
    koploper:
      "The {kloof} is measured systematically, down to behaviour in {app} — don't waste the room's time re-deriving numbers. Challenge them instead to name the one {klant} journey where the data says women drop off and a proposition should intervene.",
  },
  marketing_communicatie: {
    "blinde vlek":
      "Communication is effectively gender-blind here: one default {klant}, one fulltime life path. Pull two or three of their own onboarding messages onto the screen — a live rewrite will land harder than any chart.",
    latent:
      "Some campaigns have touched women as an audience, but nothing is tested on how it lands or timed to the moments that widen the {kloof}. Anchor the discussion on life events — parental leave, hours changes — where one message would actually count.",
    "in opbouw":
      "Messaging is consciously tested on women, but it is not yet accountable for behaviour change. Push the room from reach to results: which campaign actually changed what {klanten} did, and what would a {kloof}-closing campaign KPI look like?",
    koploper:
      "Comms is already gender-aware and measured on behaviour — rare, and an asset. Use it as the delivery channel for whatever proposition the sprint lands on, and let the marketing people draft the launch message live in the room.",
  },
  ecosystemen: {
    "blinde vlek":
      "The channel — employers, advisers, partners — has never been asked to carry the {kloof}. Treat this as greenfield: map who actually talks to the {klant} at the moments that matter, because today nobody does it on this {instelling}'s behalf.",
    latent:
      "A partner or adviser initiative exists somewhere, but the channel is neither equipped nor expected to raise the {kloof}. Have the room list its three most-trusted touchpoints and ask what single tool would let them carry the message.",
    "in opbouw":
      "Parts of the channel already get data or tools on the {kloof}; coverage is the issue, not willingness. Focus the session on the partner segment that reaches underserved {klanten} and is still empty-handed.",
    koploper:
      "The ecosystem is already activated — partners carry both the data and the conversation. The leverage now is selection: double down on the routes that demonstrably reach women other {instellingen} miss.",
  },
  proposities: {
    "blinde vlek":
      "No product, default or feature exists that was designed around the {kloof} — the {product} still assume a standard fulltime career. That is the sprint's opening, so protect the afternoon proposition round: it starts from a blank sheet.",
    latent:
      "There are proposition ideas or one-off pilots, but nothing structural: defaults still quietly widen the {kloof}. Use the assessment statements as a checklist — especially 'doing nothing should shrink the gap' — to pick the one default worth redesigning today.",
    "in opbouw":
      "At least one {kloof}-aware proposition is live or has been tested; the question is whether it reaches the {klanten} who need it and moves the number. Bring its uptake data into the room and design the next iteration, not the first.",
    koploper:
      "The {product} are already designed for diverse life paths, so the sprint should sharpen rather than invent. Aim the day at quantifying impact — how much of the {kloof} does this actually close — and at exporting the recipe.",
  },
};

/** Lowercase {token} → sector vocabulary (plurals before singulars). */
function fillVocab(template: string, vocab: SectorVocab): string {
  return template
    .replaceAll("{klanten}", vocab.klanten)
    .replaceAll("{klant}", vocab.klant)
    .replaceAll("{kloof}", vocab.kloof)
    .replaceAll("{app}", vocab.app)
    .replaceAll("{product}", vocab.product)
    .replaceAll("{instellingen}", vocab.instellingen)
    .replaceAll("{instelling}", vocab.instelling);
}

function narrativeFor(
  key: DimensionKey,
  pct: number,
  vocab: SectorVocab
): string {
  const label = bandFor(pct).label as BandLabel;
  return fillVocab(NARRATIVES[key][label], vocab);
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

// ----------------------------------------------------------- reveal script

function buildRevealScript(
  overall: { pct: number; band: Band } | null,
  focus: BriefingDimension[],
  flagged: BriefingDivergence[],
  voices: BriefingVoice[]
): string[] {
  const step1 = overall
    ? `Show the overall ring first: ${overall.pct}% — "${overall.band.label}". Then stop talking. Let the room read the number before you explain anything.`
    : `Show the overall ring first and pause — the number speaks before you do. (The ring appears the moment the first assessment lands.)`;

  const step2 =
    focus.length === 2
      ? `Walk the five dimension rings one by one, leaving the two lowest — ${focus[0].label} (${focus[0].pct}%) and ${focus[1].label} (${focus[1].pct}%) — for last. The order builds the case for where today's energy goes.`
      : `Walk the five dimension rings one by one, leaving the two lowest for last. The order builds the case for where today's energy goes.`;

  const divergencePart =
    flagged.length > 0
      ? `Read one divergence aloud (${flagged[0].label}: ${flagged[0].low.name} at ${flagged[0].low.pct}% vs ${flagged[0].high.name} at ${flagged[0].high.pct}%)`
      : `Read one divergence aloud (pick the widest spread)`;
  const voicePart =
    voices.length > 0
      ? `and one pre-work quote (${voices[0].name}'s works well)`
      : `and one pre-work quote`;
  const step3 = `${divergencePart} ${voicePart}, then hand the room over to the quantified opportunity — the evidence numbers below go on screen.`;

  return [step1, step2, step3];
}

// ------------------------------------------------------------------- build

/**
 * The full briefing for a sprint, or null when the sprint id is unknown
 * (the page turns that into a 404). Works with zero assessments: scores,
 * focus and divergence stay empty while pre-work, mandate and evidence
 * still populate.
 */
export async function buildBriefing(sprintId: string): Promise<Briefing | null> {
  await ensureSchema();
  const c = db();

  const sprintRes = await c.execute({
    sql: "SELECT id, client, sprint_date, token, sector, region FROM sprints WHERE id = ?",
    args: [sprintId],
  });
  if (sprintRes.rows.length === 0) return null;
  const sprint = sprintRes.rows[0];
  const client = String(sprint.client);
  const sector = sprint.sector == null ? "pensioen" : String(sprint.sector);
  const region = sprint.region == null ? "nl" : String(sprint.region);
  const vocab = sectorVocab(sector);

  // ---- participants + per-respondent scores (mirrors the dashboard query)
  const rowsRes = await c.execute({
    sql: `SELECT p.id, p.name, p.role, p.prework,
                 s.mens_organisatie, s.data, s.marketing_communicatie,
                 s.ecosystemen, s.proposities, s.overall
          FROM participants p
          LEFT JOIN assessments a ON a.participant_id = p.id
          LEFT JOIN scores s ON s.assessment_id = a.id
          WHERE p.sprint_id = ?
          ORDER BY p.created_at ASC`,
    args: [sprintId],
  });
  const respondents = rowsRes.rows.map((r) => ({
    name: String(r.name),
    role: r.role == null ? null : String(r.role),
    prework: r.prework == null ? "" : String(r.prework).trim(),
    scores:
      r.overall == null
        ? null
        : (Object.fromEntries(
            DIMENSIONS.map((d) => [d.key, Number(r[d.key])])
          ) as Record<DimensionKey, number>),
  }));
  const scored = respondents.filter(
    (r): r is (typeof respondents)[number] & {
      scores: Record<DimensionKey, number>;
    } => r.scores !== null
  );

  // ---- merged percentages, overall, focus, narratives
  let dimensions: BriefingDimension[] = [];
  let overall: { pct: number; band: Band } | null = null;
  let focus: BriefingDimension[] = [];
  if (scored.length > 0) {
    const merged = Object.fromEntries(
      DIMENSIONS.map((d) => [d.key, mergePcts(scored.map((r) => r.scores[d.key]))])
    ) as Record<DimensionKey, number>;
    const overallValue = overallPct(DIMENSIONS.map((d) => merged[d.key]));
    overall = { pct: overallValue, band: bandFor(overallValue) };

    // Two lowest dimensions = the sprint focus (stable sort keeps the
    // canonical dimension order on ties).
    const focusKeys = new Set(
      [...DIMENSIONS]
        .sort((a, b) => merged[a.key] - merged[b.key])
        .slice(0, 2)
        .map((d) => d.key)
    );
    dimensions = DIMENSIONS.map((d) => ({
      key: d.key,
      label: d.label,
      pct: merged[d.key],
      band: bandFor(merged[d.key]),
      narrative: narrativeFor(d.key, merged[d.key], vocab),
      isFocus: focusKeys.has(d.key),
    }));
    focus = dimensions
      .filter((d) => d.isFocus)
      .sort((a, b) => a.pct - b.pct);
  }

  // ---- divergence: min–max spread per dimension, with the people at the
  // extremes (first respondent at each extreme on ties)
  const divergence: BriefingDivergence[] =
    scored.length >= 2
      ? DIMENSIONS.map((d) => {
          let low = scored[0];
          let high = scored[0];
          for (const r of scored) {
            if (r.scores[d.key] < low.scores[d.key]) low = r;
            if (r.scores[d.key] > high.scores[d.key]) high = r;
          }
          const spread = high.scores[d.key] - low.scores[d.key];
          const flagged = spread >= DIVERGENCE_THRESHOLD;
          return {
            key: d.key,
            label: d.label,
            low: { name: low.name, pct: low.scores[d.key] },
            high: { name: high.name, pct: high.scores[d.key] },
            spread,
            flagged,
            flagLine: flagged ? FLAG_LINE : null,
          };
        })
      : [];

  // ---- pre-work voices (verbatim; skip empties, count the skips)
  const voices: BriefingVoice[] = respondents
    .filter((r) => r.prework !== "")
    .map((r) => ({ name: r.name, role: r.role, quote: r.prework }));
  const preworkSkipped = respondents.length - voices.length;

  // ---- draft mandate (Dutch, sector vocabulary; the room rewrites it)
  const draftMandate = `Hoe wordt ${client} de ${vocab.instelling} die de ${vocab.kloof} voor vrouwelijke ${vocab.klanten} meetbaar dicht — zonder dat de ${vocab.klant} iets hoeft te doen?`;

  // ---- evidence: top 5 matched reports (same matching as the dashboard —
  // sprint sector + cross-sector, relevant regions, region-specific first)
  const regions = relevantRegions(region);
  const researchRes = await c.execute({
    sql: `SELECT id, title, organization, year, url, key_stats
          FROM research_reports
          WHERE sector IN (?, 'algemeen')
            AND region IN (${regions.map(() => "?").join(", ")})
          ORDER BY CASE WHEN region = ? THEN 0 ELSE 1 END, year DESC, title ASC
          LIMIT 5`,
    args: [sector, ...regions, region],
  });
  const evidence: BriefingEvidence[] = researchRes.rows.map((r) => ({
    id: String(r.id),
    title: String(r.title),
    organization: r.organization == null ? null : String(r.organization),
    year: r.year == null ? null : Number(r.year),
    url: String(r.url),
    keyStats: parseKeyStats(r.key_stats),
  }));

  const flagged = divergence.filter((d) => d.flagged);

  return {
    sprint: {
      id: String(sprint.id),
      client,
      sector,
      sectorLabel: sectorLabel(sector),
      region,
      regionLabel: regionLabel(region),
      date: formatDutchDate(
        sprint.sprint_date == null ? null : String(sprint.sprint_date)
      ),
      participantCount: respondents.length,
      assessmentCount: scored.length,
    },
    dimensions,
    overall,
    focus,
    divergence,
    voices,
    preworkSkipped,
    draftMandate,
    evidence,
    revealScript: buildRevealScript(overall, focus, flagged, voices),
  };
}
