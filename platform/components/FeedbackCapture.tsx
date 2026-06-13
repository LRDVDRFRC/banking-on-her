"use client";

import { useCallback, useEffect, useRef, useState, type JSX } from "react";

// Phase 6 capture form — DUTCH, for the panel host on a tablet between two
// panelists. Optimized for fast repeated entry: quick-pick panelist chips,
// three thumb-sized 1–5 rows, save → green flash → auto-advance to the next
// panelist with scores/text cleared.

const SCORE_ROWS = [
  { key: "gebruiken", label: "Zou ik gebruiken" },
  { key: "begrijpen", label: "Begrijp ik meteen" },
  { key: "vertrouwen", label: "Vertrouw ik" },
] as const;

type ScoreKey = (typeof SCORE_ROWS)[number]["key"];
type Scores = Record<ScoreKey, number | null>;

const EMPTY_SCORES: Scores = { gebruiken: null, begrijpen: null, vertrouwen: null };

const PANEL_CHIPS = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"];

/** "P3" → "P4" (caps at P8); anything else stays as typed. */
function nextPanelist(current: string): string {
  const m = /^P([1-8])$/i.exec(current.trim());
  if (!m) return current;
  const n = Math.min(8, Number(m[1]) + 1);
  return `P${n}`;
}

export default function FeedbackCapture({
  sprintId,
  conceptId,
  token,
}: {
  sprintId: string;
  conceptId: string;
  token: string;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const [panelist, setPanelist] = useState("P1");
  const [scores, setScores] = useState<Scores>(EMPTY_SCORES);
  const [quotes, setQuotes] = useState("");
  const [observations, setObservations] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshCount = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/feedback?token=${encodeURIComponent(token)}&conceptId=${encodeURIComponent(conceptId)}`
      );
      if (!res.ok) return;
      const data = (await res.json()) as { count?: number };
      if (typeof data.count === "number") setCount(data.count);
    } catch {
      // count is a nicety — never block the form on it
    }
  }, [token, conceptId]);

  useEffect(() => {
    void refreshCount();
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, [refreshCount]);

  const complete =
    panelist.trim() !== "" && SCORE_ROWS.every((r) => scores[r.key] !== null);

  async function save() {
    if (busy || !complete) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          sprintId,
          conceptId,
          panelist: panelist.trim(),
          scores: {
            gebruiken: scores.gebruiken,
            begrijpen: scores.begrijpen,
            vertrouwen: scores.vertrouwen,
          },
          quotes,
          observations,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Opslaan mislukte — probeer het nog een keer.");
        return;
      }
      // Reset for the next panelist; keep their label convenient (P3 → P4).
      setPanelist(nextPanelist(panelist));
      setScores(EMPTY_SCORES);
      setQuotes("");
      setObservations("");
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 3000);
      void refreshCount();
    } catch {
      setError("Geen verbinding — staat de wifi nog aan?");
    } finally {
      setBusy(false);
    }
  }

  const rowLabelStyle: React.CSSProperties = {
    fontFamily: "'Sora', sans-serif",
    fontWeight: 600,
    fontSize: "0.95rem",
  };

  return (
    <section className="glass-sm" aria-label="Noteer reactie" style={{ marginBottom: 28 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontFamily: "'Sora', sans-serif",
            fontWeight: 700,
            fontSize: "1.1rem",
            color: "var(--ink)",
          }}
        >
          {open ? "▾" : "▸"} Noteer reactie
        </span>
        <span className="muted small" style={{ whiteSpace: "nowrap" }}>
          {count === null
            ? ""
            : `${count} ${count === 1 ? "reactie" : "reacties"} vastgelegd voor dit concept`}
        </span>
      </button>

      {open ? (
        <div style={{ marginTop: 20 }}>
          {/* ---- panelist ---- */}
          <div className="field-full" style={{ marginTop: 0, marginBottom: 18 }}>
            <label htmlFor={`fb-panelist-${conceptId}`}>Panelist</label>
            <input
              id={`fb-panelist-${conceptId}`}
              type="text"
              value={panelist}
              onChange={(e) => setPanelist(e.target.value)}
              placeholder="P1 — of een naam"
              autoComplete="off"
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              {PANEL_CHIPS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPanelist(p)}
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    padding: "8px 16px",
                    borderRadius: 999,
                    cursor: "pointer",
                    border:
                      panelist.trim().toUpperCase() === p
                        ? "1px solid var(--ink)"
                        : "1px solid rgba(13,59,46,0.22)",
                    background:
                      panelist.trim().toUpperCase() === p ? "var(--ink)" : "rgba(255,255,255,0.55)",
                    color: panelist.trim().toUpperCase() === p ? "#fff" : "rgba(13,59,46,0.7)",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* ---- the three 1–5 scores ---- */}
          {SCORE_ROWS.map((row) => (
            <div
              key={row.key}
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "12px 0",
                borderTop: "1px solid rgba(13,59,46,0.08)",
              }}
            >
              <span style={rowLabelStyle}>&ldquo;{row.label}&rdquo;</span>
              <div className="seg" role="radiogroup" aria-label={row.label}>
                {[1, 2, 3, 4, 5].map((v) => (
                  <label className="seg-btn" key={v}>
                    <input
                      type="radio"
                      name={`fb-${conceptId}-${row.key}`}
                      value={v}
                      checked={scores[row.key] === v}
                      onChange={() => setScores((s) => ({ ...s, [row.key]: v }))}
                    />
                    <span>{v}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {/* ---- quotes ---- */}
          <div className="field-full" style={{ marginTop: 18 }}>
            <label htmlFor={`fb-quotes-${conceptId}`}>
              Letterlijke uitspraken — typ mee terwijl ze praat
            </label>
            <textarea
              id={`fb-quotes-${conceptId}`}
              value={quotes}
              onChange={(e) => setQuotes(e.target.value)}
              placeholder={'"Eindelijk zegt iemand het gewoon eerlijk."'}
              rows={3}
              style={{ minHeight: 88 }}
            />
          </div>

          {/* ---- observations ---- */}
          <div className="field-full">
            <label htmlFor={`fb-observations-${conceptId}`}>
              Wat zag je — aarzeling, enthousiasme, waar klikte ze?
            </label>
            <textarea
              id={`fb-observations-${conceptId}`}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Bleef hangen op het eerste scherm; lichtte op bij het rekenvoorbeeld."
              rows={3}
              style={{ minHeight: 88 }}
            />
          </div>

          {/* ---- save ---- */}
          <div className="btn-row" style={{ marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={save}
              disabled={busy || !complete}
            >
              {busy ? "Opslaan…" : "Sla op"}
            </button>
            {!complete ? (
              <span className="muted small">Panelist + drie scores zijn genoeg — quotes mogen later.</span>
            ) : null}
          </div>

          {saved ? (
            <p
              role="status"
              style={{
                marginTop: 14,
                marginBottom: 0,
                fontFamily: "'Sora', sans-serif",
                fontWeight: 700,
                fontSize: "0.95rem",
                color: "#1d7a4f",
                background: "rgba(159,212,176,0.35)",
                border: "1px solid rgba(159,212,176,0.8)",
                borderRadius: 12,
                padding: "10px 16px",
              }}
            >
              ✓ Opgeslagen — volgende panelist
            </p>
          ) : null}
          {error ? (
            <p
              className="small"
              style={{ marginTop: 14, marginBottom: 0, color: "var(--rose)", fontWeight: 600 }}
            >
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
