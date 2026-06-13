// One-click Day-2 deck generation — loads a sprint from the database and
// returns the boardroom proposition deck (lib/deck-template.ts, embedded from
// sprint/03_proposition-deck.html) with the sprint's data filled in.
//
// The replacement logic ports the context-anchored approach of
// sprint/08_fill-deck.js:
//
//   a. Every "BeFrank" (logos, headlines, body copy) → the sprint's client.
//   b. «datum» (title + closing slide) → the Dutch-formatted sprint date;
//      left as «datum» when the sprint has no date.
//   c. With ≥1 assessment: the five diagnose rings are rewritten — anchored
//      on the Dutch <p class="grade-dim"> labels, walking back to the nearest
//      <div class="ring" block, updating --p, the band colour --c
//      (<35 var(--amber) · 35–59 var(--rose) · 60–79 var(--sky) · ≥80
//      var(--mint)) and the <span class="ring-value">NN%</span>. The
//      "Totaaloordeel: <span …>49% — latent.</span>" line gets the computed
//      overall + band name (blinde vlek / latent / in opbouw / koploper),
//      keeping the span markup verbatim.
//   d. With zero assessments the template's example ring values stay as-is.
//   e. Business-case «X» tokens are left untouched (no data source yet).
//
// Scores merge exactly like the dashboard (app/dashboard/[id]/page.tsx):
// per dimension the rounded mean of the per-respondent percentages
// (mergePcts); overall the rounded mean of the five merged values
// (overallPct).
//
// Anchors that fail to match are skipped silently; each miss is collected in
// a warnings list that is appended to the HTML as a trailing comment
// (<!-- fill warnings: … -->). A clean fill appends nothing.

import { db, ensureSchema } from "@/lib/db";
import { formatDutchDate } from "@/lib/dates";
import { DECK_TEMPLATE } from "@/lib/deck-template";
import {
  DIMENSIONS,
  bandFor,
  mergePcts,
  overallPct,
  type DimensionKey,
} from "@/lib/scoring";

/** "Mens & organisatie" → "Mens &amp; organisatie" — as escaped in the deck markup. */
function escapeLabel(label: string): string {
  return label.replace(/&/g, "&amp;");
}

export async function buildFilledDeck(
  sprintId: string
): Promise<{ html: string } | null> {
  await ensureSchema();
  const c = db();

  const sprintRes = await c.execute({
    sql: "SELECT id, client, sprint_date FROM sprints WHERE id = ?",
    args: [sprintId],
  });
  if (sprintRes.rows.length === 0) return null;
  const sprint = sprintRes.rows[0];
  const client = String(sprint.client);
  const sprintDate =
    sprint.sprint_date == null ? null : String(sprint.sprint_date);

  // Merged dimension percentages, exactly like the dashboard: the rounded
  // mean of each respondent's dimension percentage.
  const scoreRes = await c.execute({
    sql: `SELECT s.mens_organisatie, s.data, s.marketing_communicatie, s.ecosystemen, s.proposities
          FROM scores s JOIN assessments a ON a.id = s.assessment_id
          WHERE a.sprint_id = ?`,
    args: [sprintId],
  });
  const hasAssessments = scoreRes.rows.length > 0;
  const merged = hasAssessments
    ? (Object.fromEntries(
        DIMENSIONS.map((d) => [
          d.key,
          mergePcts(scoreRes.rows.map((r) => Number(r[d.key]))),
        ])
      ) as Record<DimensionKey, number>)
    : null;

  const warnings: string[] = [];
  let html: string = DECK_TEMPLATE;

  // ------------------------------------------------- a. "BeFrank" → client
  if (html.includes("BeFrank")) {
    // Replacer callback sidesteps `$`-pattern expansion in client names.
    html = html.replaceAll("BeFrank", () => client);
  } else {
    warnings.push('client anchor "BeFrank" not found');
  }

  // -------------------------------------------------------------- b. datum
  const datum = formatDutchDate(sprintDate);
  if (datum !== null) {
    if (html.includes("«datum»")) {
      html = html.replaceAll("«datum»", () => datum);
    } else {
      warnings.push("«datum» anchor not found");
    }
  } // no date → «datum» stays in place

  // ------------------------------------- c. rings + totaaloordeel (scored)
  if (merged) {
    for (const dim of DIMENSIONS) {
      const pct = merged[dim.key];
      const label = escapeLabel(dim.label);

      // Anchor on the Dutch dimension label, walk back to its .ring block.
      const labelAnchor = `<p class="grade-dim">${label}</p>`;
      const labelIdx = html.indexOf(labelAnchor);
      if (labelIdx === -1) {
        warnings.push(`ring label not found: ${label}`);
        continue;
      }
      const ringStart = html.lastIndexOf('<div class="ring"', labelIdx);
      if (ringStart === -1) {
        warnings.push(`no .ring block before label: ${label}`);
        continue;
      }
      let block = html.slice(ringStart, labelIdx);
      const pPat = /--p:\s*\d+/;
      const cPat = /--c:\s*var\(--(?:rose|sky|amber|mint)\)/;
      const vPat = /<span class="ring-value">\d+%<\/span>/;
      if (!pPat.test(block) || !cPat.test(block) || !vPat.test(block)) {
        warnings.push(`unexpected ring markup for: ${label}`);
        continue;
      }
      // bandFor's colour doubles as the ring band:
      // <35 amber · 35–59 rose · 60–79 sky · ≥80 mint.
      block = block
        .replace(pPat, `--p: ${pct}`)
        .replace(cPat, `--c: ${bandFor(pct).color}`)
        .replace(vPat, `<span class="ring-value">${pct}%</span>`);
      html = html.slice(0, ringStart) + block + html.slice(labelIdx);
    }

    const overall = overallPct(DIMENSIONS.map((d) => merged[d.key]));
    const band = bandFor(overall);
    const totaalAnchor =
      'Totaaloordeel: <span style="color: var(--rose);">49% — latent.</span>';
    if (html.includes(totaalAnchor)) {
      html = html.replace(
        totaalAnchor,
        `Totaaloordeel: <span style="color: var(--rose);">${overall}% — ${band.label}.</span>`
      );
    } else {
      warnings.push("totaaloordeel anchor not found");
    }
  } // d. zero assessments → template ring values stay untouched

  // e. business-case «X» tokens: intentionally left untouched.

  if (warnings.length > 0) {
    html += `\n<!-- fill warnings: ${warnings.join("; ")} -->\n`;
  }

  return { html };
}
