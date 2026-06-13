// Facilitator-facing benchmark panel: this sprint's merged readiness next to
// the anonymised portfolio baseline. Async server component — drop
// <BenchmarkPanel sprintId={...} /> into any facilitator page; it fetches its
// own data via lib/benchmark. English, Prism glass idiom. Deltas within
// ±3 points read as neutral (rounding noise, not signal).

import type { CSSProperties } from "react";
import { getBenchmark } from "@/lib/benchmark";
import { DIMENSIONS } from "@/lib/scoring";

const NEUTRAL_WITHIN = 3;
const ROW_BORDER = "1px solid rgba(13,59,46,0.10)";

function Delta({ delta }: { delta: number }) {
  const style: CSSProperties = {
    fontFamily: "'Sora', sans-serif",
    fontWeight: 700,
    fontSize: "0.85rem",
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
  };
  if (Math.abs(delta) <= NEUTRAL_WITHIN) {
    return (
      <span className="muted" style={style} title="Within ±3 points of the portfolio — treat as level">
        ±{Math.abs(delta)}
      </span>
    );
  }
  const above = delta > 0;
  return (
    <span
      style={{ ...style, color: above ? "var(--sky)" : "var(--rose)" }}
      title={above ? "Above the portfolio baseline" : "Below the portfolio baseline"}
    >
      {above ? "▲" : "▼"} {above ? "+" : "−"}
      {Math.abs(delta)}
    </span>
  );
}

function Row({
  label,
  sprintPct,
  baselinePct,
  strong = false,
}: {
  label: string;
  sprintPct: number;
  baselinePct: number;
  strong?: boolean;
}) {
  const num: CSSProperties = {
    textAlign: "right",
    fontVariantNumeric: "tabular-nums",
    fontWeight: strong ? 700 : 400,
  };
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(140px, 1fr) 64px 76px 64px",
        gap: 12,
        alignItems: "baseline",
        padding: "10px 0",
        borderTop: strong ? "1px solid rgba(13,59,46,0.22)" : ROW_BORDER,
      }}
    >
      <p
        style={{
          fontFamily: "'Sora', sans-serif",
          fontWeight: strong ? 700 : 600,
          fontSize: "0.85rem",
          lineHeight: 1.3,
        }}
      >
        {label}
      </p>
      <p style={num}>{sprintPct}%</p>
      <p className="muted" style={num}>
        {baselinePct}%
      </p>
      <p style={{ textAlign: "right" }}>
        <Delta delta={sprintPct - baselinePct} />
      </p>
    </div>
  );
}

export default async function BenchmarkPanel({ sprintId }: { sprintId: string }) {
  const { sprint, baseline, n } = await getBenchmark(sprintId);

  return (
    <section className="glass-sm" aria-label="Benchmark">
      <div className="kicker" style={{ color: "var(--amber)" }}>
        Benchmark
      </div>
      <h2 style={{ fontSize: "1.3rem", marginBottom: 6 }}>
        How this sprint compares.
      </h2>

      {baseline === null ? (
        <p className="muted" style={{ marginTop: 12 }}>
          Benchmark unlocks as more sprints complete — this becomes the
          membership community&rsquo;s evidence base.
        </p>
      ) : sprint === null ? (
        <p className="muted" style={{ marginTop: 12 }}>
          No assessments yet.
        </p>
      ) : (
        <>
          <div
            className="muted"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(140px, 1fr) 64px 76px 64px",
              gap: 12,
              marginTop: 14,
              fontFamily: "'Sora', sans-serif",
              fontSize: "0.62rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <span>Dimension</span>
            <span style={{ textAlign: "right" }}>Sprint</span>
            <span style={{ textAlign: "right" }}>Portfolio</span>
            <span style={{ textAlign: "right" }}>Δ</span>
          </div>
          <div style={{ marginTop: 6 }}>
            {DIMENSIONS.map((dim) => (
              <Row
                key={dim.key}
                label={dim.label}
                sprintPct={sprint.scores[dim.key]}
                baselinePct={baseline.scores[dim.key]}
              />
            ))}
            <Row
              label="Overall"
              sprintPct={sprint.overall}
              baselinePct={baseline.overall}
              strong
            />
          </div>
          <p className="muted small" style={{ marginTop: 14, marginBottom: 0 }}>
            Portfolio baseline: {n} other sprint{n === 1 ? "" : "s"}, anonymised.
          </p>
        </>
      )}
    </section>
  );
}
