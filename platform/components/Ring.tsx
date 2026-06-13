import { bandFor } from "@/lib/scoring";

const CIRCUMFERENCE = 326.7; // 2 · π · r, r = 52 in a 120 viewBox — same as the deck

/**
 * Readiness ring — a circle whose border fills clockwise from 12 o'clock to the
 * percentage, coloured by band. Server-renderable (no client JS required).
 * Percentage rings only — never letter grades.
 */
export default function Ring({
  pct,
  label,
  size = 110,
}: {
  pct: number;
  label?: string;
  size?: number;
}) {
  const band = bandFor(pct);
  const offset = CIRCUMFERENCE * (1 - Math.min(100, Math.max(0, pct)) / 100);
  const fontSize = size >= 140 ? "1.9rem" : size <= 95 ? "1.1rem" : "1.35rem";

  return (
    <div className="ring-wrap">
      <div className="ring" style={{ width: size, height: size }}>
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle className="track" cx="60" cy="60" r="52" />
          <circle
            className="fill"
            cx="60"
            cy="60"
            r="52"
            style={{
              stroke: band.color,
              strokeDasharray: CIRCUMFERENCE,
              strokeDashoffset: offset,
            }}
          />
        </svg>
        <span className="ring-value" style={{ color: band.color, fontSize }}>
          {pct}%
        </span>
      </div>
      {label ? <p className="grade-dim">{label}</p> : null}
    </div>
  );
}
