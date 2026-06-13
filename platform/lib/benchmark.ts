// Cross-sprint benchmark: how does one sprint compare with the rest of the
// portfolio? Merge per sprint FIRST (rounded mean of that sprint's respondents
// per dimension — identical to the dashboard's merged readiness), then average
// the merged sprint scores across the OTHER sprints to get the portfolio
// baseline. Sprints with zero submitted assessments don't count toward the
// baseline. Facilitator-facing and anonymised: no client names leave this
// module — only counts and percentages.

import { db, ensureSchema } from "@/lib/db";
import {
  DIMENSIONS,
  mergePcts,
  overallPct,
  type DimensionKey,
} from "@/lib/scoring";

/** Merged readiness: per-dimension pct plus the rounded mean of the five. */
export interface MergedScores {
  scores: Record<DimensionKey, number>;
  overall: number;
}

export interface Benchmark {
  /** This sprint's merged readiness — null when it has no assessments yet. */
  sprint: MergedScores | null;
  /**
   * Portfolio baseline: per dimension the mean of the merged scores of all
   * OTHER sprints with ≥1 assessment — null when there are none (n === 0).
   */
  baseline: MergedScores | null;
  /** Number of OTHER sprints with at least one assessment in. */
  n: number;
}

/** Dashboard math: mergePcts per dimension, overallPct of the five merged. */
function merge(respondents: Record<DimensionKey, number>[]): MergedScores {
  const scores = Object.fromEntries(
    DIMENSIONS.map((d) => [d.key, mergePcts(respondents.map((r) => r[d.key]))])
  ) as Record<DimensionKey, number>;
  return { scores, overall: overallPct(DIMENSIONS.map((d) => scores[d.key])) };
}

/**
 * Benchmark for a sprint: its own merged dimension scores next to the
 * portfolio baseline across all other sprints that have ≥1 assessment.
 * Both sides degrade to null gracefully (new sprint / first-ever sprint).
 */
export async function getBenchmark(sprintId: string): Promise<Benchmark> {
  await ensureSchema();
  const res = await db().execute(
    `SELECT a.sprint_id, s.mens_organisatie, s.data, s.marketing_communicatie, s.ecosystemen, s.proposities
     FROM assessments a
     JOIN scores s ON s.assessment_id = a.id`
  );

  // Group respondent score rows per sprint.
  const bySprint = new Map<string, Record<DimensionKey, number>[]>();
  for (const row of res.rows) {
    const sid = String(row.sprint_id);
    const scores = Object.fromEntries(
      DIMENSIONS.map((d) => [d.key, Number(row[d.key])])
    ) as Record<DimensionKey, number>;
    const list = bySprint.get(sid);
    if (list) list.push(scores);
    else bySprint.set(sid, [scores]);
  }

  const own = bySprint.get(sprintId);
  const sprint = own ? merge(own) : null;

  // Merge each OTHER sprint, then average the merged scores per dimension.
  const others = [...bySprint.entries()]
    .filter(([sid]) => sid !== sprintId)
    .map(([, respondents]) => merge(respondents));
  if (others.length === 0) return { sprint, baseline: null, n: 0 };

  const scores = Object.fromEntries(
    DIMENSIONS.map((d) => [d.key, mergePcts(others.map((m) => m.scores[d.key]))])
  ) as Record<DimensionKey, number>;
  const baseline: MergedScores = {
    scores,
    overall: overallPct(DIMENSIONS.map((d) => scores[d.key])),
  };

  return { sprint, baseline, n: others.length };
}
