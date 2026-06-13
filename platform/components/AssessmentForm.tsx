"use client";

import { useState } from "react";
import Ring from "@/components/Ring";
import { submitAssessment } from "@/app/actions";
import {
  BAND_LEGEND,
  DIMENSIONS,
  TOTAL_QUESTIONS,
  bandFor,
  dimensionPct,
  overallPct,
  type DimensionKey,
} from "@/lib/scoring";

type AnswerState = Record<DimensionKey, (number | null)[]>;

/** Blank state, optionally seeded with previous answers (the edit flow). */
function seedAnswers(prev?: Partial<Record<DimensionKey, number[]>>): AnswerState {
  const init = {} as AnswerState;
  for (const d of DIMENSIONS) {
    const given = prev?.[d.key];
    init[d.key] = Array.from({ length: d.questions.length }, (_, i) => {
      const v = given?.[i];
      return typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 4
        ? v
        : null;
    });
  }
  return init;
}

export default function AssessmentForm({
  token,
  participantId,
  statements,
  descs,
  initialAnswers,
}: {
  token: string;
  participantId: string;
  /** The 29 sector-resolved statements, flat, in dimension order (lib/scoring getStatements). */
  statements: string[];
  /** The five sector-resolved dimension descriptions (lib/scoring getDimensionDescs). */
  descs: string[];
  /** Previous answers (answers_json `answers` shape) — pre-fills the form for resubmission. */
  initialAnswers?: Partial<Record<DimensionKey, number[]>>;
}) {
  const [answers, setAnswers] = useState<AnswerState>(() =>
    seedAnswers(initialAnswers)
  );

  // Flat offsets into `statements` per dimension (6 · 6 · 6 · 5 · 6).
  const offsets: number[] = [];
  let running = 0;
  for (const d of DIMENSIONS) {
    offsets.push(running);
    running += d.questions.length;
  }

  const setAnswer = (key: DimensionKey, qi: number, v: number) =>
    setAnswers((prev) => ({
      ...prev,
      [key]: prev[key].map((x, i) => (i === qi ? v : x)),
    }));

  // Live scoring — unanswered counts as 0, same as the offline form.
  const pcts = DIMENSIONS.map((d) =>
    dimensionPct(answers[d.key].map((v) => v ?? 0))
  );
  const overall = overallPct(pcts);
  const band = bandFor(overall);
  const unanswered = DIMENSIONS.reduce(
    (acc, d) => acc + answers[d.key].filter((v) => v === null).length,
    0
  );
  const ready = unanswered === 0;

  return (
    <form action={submitAssessment}>
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="participant" value={participantId} />

      {DIMENSIONS.map((dim, di) => {
        const answered = answers[dim.key].filter((v) => v !== null).length;
        return (
          <section
            className="glass dim"
            key={dim.key}
            aria-label={`Dimensie ${di + 1}: ${dim.label}`}
          >
            <div className="dim-head">
              <div>
                <div className="kicker" style={{ color: dim.accent }}>
                  Dimensie {di + 1} · {dim.questions.length} stellingen
                </div>
                <h2>{dim.label}</h2>
                <p className="dim-desc">{descs[di] ?? dim.desc}</p>
              </div>
              <div className="dim-head-ring">
                <Ring pct={pcts[di]} size={92} />
                <p className="ring-progress">
                  {answered}/{dim.questions.length} beantwoord
                </p>
              </div>
            </div>
            <ol className="q-list">
              {dim.questions.map((_, qi) => (
                <li className="q-item" key={qi}>
                  <p className="q-text">
                    <span className="q-num">{qi + 1}.</span>
                    {statements[offsets[di] + qi]}
                  </p>
                  <div
                    className="seg"
                    role="radiogroup"
                    aria-label={`Score 0 tot 4 voor stelling ${qi + 1}`}
                  >
                    {[0, 1, 2, 3, 4].map((v) => (
                      <label className="seg-btn" key={v}>
                        <input
                          type="radio"
                          name={`q__${dim.key}__${qi}`}
                          value={v}
                          checked={answers[dim.key][qi] === v}
                          onChange={() => setAnswer(dim.key, qi, v)}
                        />
                        <span>{v}</span>
                      </label>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        );
      })}

      <section className="glass dim" aria-label="Live resultaat">
        <div className="kicker" style={{ color: "var(--mint)" }}>Live resultaat</div>
        <h2 style={{ fontSize: "1.6rem", marginBottom: 28 }}>
          Jouw readiness, terwijl je invult.
        </h2>
        <div className="results-grid">
          {DIMENSIONS.map((dim, di) => (
            <div className="glass-sm result-card" key={dim.key}>
              <Ring pct={pcts[di]} label={dim.label} size={92} />
            </div>
          ))}
        </div>
        <div className="overall-wrap">
          <Ring pct={overall} size={160} />
          <p className="grade-dim"><strong>Totaal</strong></p>
          <p className="overall-band" style={{ color: band.color }}>{band.label}</p>
          <p className="overall-band-desc">{band.desc}</p>
          <p className="band-legend">{BAND_LEGEND}</p>
        </div>
      </section>

      <section className="glass-sm dim" aria-label="Versturen">
        <div className="kicker" style={{ color: "var(--sky)" }}>Klaar? Stuur je antwoorden in</div>
        <p className={`export-status${ready ? " ready" : ""}`}>
          {ready
            ? "Alles ingevuld — klaar om te versturen."
            : `Nog ${unanswered} van ${TOTAL_QUESTIONS} vragen onbeantwoord.`}
        </p>
        <div className="btn-row">
          <button type="submit" className="btn btn-primary" disabled={!ready}>
            Verstuur mijn antwoorden
          </button>
        </div>
        <p className="muted small" style={{ marginTop: 16 }}>
          Je antwoorden gaan naar de facilitator — die legt ze naast die van je
          collega&rsquo;s en naast de data, als startpunt van de sprintdag.
        </p>
      </section>
    </form>
  );
}
