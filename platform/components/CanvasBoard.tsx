"use client";

// Phase-4 ideation canvas: the moment × mechanism grid. Mechanisms are
// columns, moments are rows; each concept is a chip in one cell. The header
// runs the DIVERSITY CHECK on the chosen set — two chosen concepts in the
// same cell test as one idea tonight, so that's a hard warning.

import { Fragment, useState, useTransition, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import type { AxisItem } from "@/lib/moments";
import {
  addConcept,
  removeConcept,
  toggleChosen,
} from "@/app/dashboard/[id]/canvas/actions";

export interface CanvasConcept {
  id: string;
  title: string;
  moment: string;
  mechanism: string;
  description: string | null;
  source: "room" | "ai";
  chosen: boolean;
  hasPrototype: boolean;
}

type Panel =
  | { kind: "view"; conceptId: string }
  | { kind: "add"; moment: string; mechanism: string }
  | null;

const sora: CSSProperties = { fontFamily: "'Sora', sans-serif" };

function AiBadge() {
  return (
    <span
      style={{
        ...sora,
        fontSize: "0.58rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        background: "rgba(109,192,200,0.35)",
        border: "1px solid rgba(109,192,200,0.7)",
        borderRadius: 999,
        padding: "1px 6px",
        marginLeft: 6,
        verticalAlign: "middle",
        whiteSpace: "nowrap",
      }}
    >
      AI
    </span>
  );
}

export default function CanvasBoard({
  sprintId,
  moments,
  mechanisms,
  concepts,
  aiEnabled,
}: {
  sprintId: string;
  moments: AxisItem[];
  mechanisms: AxisItem[];
  concepts: CanvasConcept[];
  aiEnabled: boolean;
}) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [suggestBusy, setSuggestBusy] = useState(false);

  const momentLabel = (key: string) => moments.find((m) => m.key === key)?.label ?? key;
  const mechanismLabel = (key: string) => mechanisms.find((m) => m.key === key)?.label ?? key;

  // ------------------------------------------------------------- diversity
  const chosen = concepts.filter((c) => c.chosen);
  const cellCounts = new Map<string, number>();
  const momentCounts = new Map<string, number>();
  const mechanismCounts = new Map<string, number>();
  for (const c of chosen) {
    const cell = `${c.moment}|${c.mechanism}`;
    cellCounts.set(cell, (cellCounts.get(cell) ?? 0) + 1);
    momentCounts.set(c.moment, (momentCounts.get(c.moment) ?? 0) + 1);
    mechanismCounts.set(c.mechanism, (mechanismCounts.get(c.mechanism) ?? 0) + 1);
  }
  const sharedCells = [...cellCounts.entries()].filter(([, n]) => n >= 2);
  const sharedMoments = [...momentCounts.entries()].filter(([, n]) => n >= 2);
  const sharedMechanisms = [...mechanismCounts.entries()].filter(([, n]) => n >= 2);

  // ---------------------------------------------------------------- actions
  function runAction(fn: () => Promise<{ ok: boolean; error?: string }>, closeOnOk = false) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Something went wrong.");
      else if (closeOnOk) setPanel(null);
    });
  }

  async function handleAdd(formData: FormData) {
    if (panel?.kind !== "add") return;
    const { moment, mechanism } = panel;
    runAction(
      () =>
        addConcept(sprintId, {
          title: String(formData.get("title") ?? ""),
          moment,
          mechanism,
          description: String(formData.get("description") ?? ""),
        }),
      true
    );
  }

  async function runSuggest() {
    if (suggestBusy) return;
    setSuggestBusy(true);
    setError(null);
    try {
      const res = await fetch(`/dashboard/${sprintId}/canvas/suggest`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? `Suggest request failed (${res.status}).`);
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error — is the server still running?");
    } finally {
      setSuggestBusy(false);
    }
  }

  const viewed =
    panel?.kind === "view" ? concepts.find((c) => c.id === panel.conceptId) ?? null : null;

  // ------------------------------------------------------------------ render
  return (
    <>
      {/* ---------- header bar: chosen count + diversity check + AI trigger ---------- */}
      <section className="glass-sm" style={{ marginBottom: 24 }} aria-label="Selection status">
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ ...sora, fontWeight: 700, fontSize: "1.05rem" }}>
            Chosen: {chosen.length} of 3–5
          </span>
          {aiEnabled ? (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: "10px 18px", fontSize: "0.85rem" }}
              onClick={runSuggest}
              disabled={suggestBusy}
            >
              {suggestBusy ? "Suggesting… (≈30–60 s)" : "Suggest concepts (AI)"}
            </button>
          ) : (
            <span className="muted small">
              AI suggestions need <code>ANTHROPIC_API_KEY</code> — the grid works without it.
            </span>
          )}
        </div>

        <div style={{ marginTop: 12 }}>
          {chosen.length > 5 && (
            <p className="small" style={{ color: "var(--rose)", fontWeight: 600, marginBottom: 6 }}>
              More than 5 chosen — the afternoon has build slots for 3–5 concepts.
            </p>
          )}
          {sharedCells.length > 0 ? (
            <p className="small" style={{ color: "var(--rose)", fontWeight: 600, marginBottom: 0 }}>
              Diversity check: two chosen ideas occupy the same cell — they&rsquo;ll test as
              one.{" "}
              {sharedCells
                .map(([cell]) => {
                  const [mo, me] = cell.split("|");
                  return `${momentLabel(mo)} × ${mechanismLabel(me)}`;
                })
                .join(" · ")}
            </p>
          ) : sharedMoments.length > 0 || sharedMechanisms.length > 0 ? (
            <p className="small" style={{ color: "#8a6d3b", fontWeight: 600, marginBottom: 0 }}>
              Note: chosen concepts share{" "}
              {[
                ...sharedMoments.map(([k]) => `the “${momentLabel(k)}” moment`),
                ...sharedMechanisms.map(([k]) => `the “${mechanismLabel(k)}” mechanism`),
              ].join(" and ")}{" "}
              — different rows and columns give tonight&rsquo;s test more signal.
            </p>
          ) : chosen.length >= 2 ? (
            <p className="small" style={{ color: "var(--ink)", opacity: 0.7, marginBottom: 0 }}>
              Good spread — every chosen concept sits in its own cell.
            </p>
          ) : (
            <p className="muted small" style={{ marginBottom: 0 }}>
              Click a chip, then “Choose for build” — the diversity check runs here as you pick.
            </p>
          )}
          {error && (
            <p className="small" style={{ color: "var(--rose)", fontWeight: 600, marginTop: 8, marginBottom: 0 }}>
              {error}
            </p>
          )}
        </div>
      </section>

      {/* ---------- the grid ---------- */}
      <div className="table-wrap" style={{ paddingBottom: 8 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `140px repeat(${mechanisms.length}, minmax(150px, 1fr))`,
            gap: 8,
            minWidth: 940,
            alignItems: "stretch",
          }}
        >
          <div />
          {mechanisms.map((mech) => (
            <div
              key={mech.key}
              style={{
                ...sora,
                fontSize: "0.68rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(13,59,46,0.55)",
                padding: "6px 8px",
                textAlign: "center",
                alignSelf: "end",
              }}
            >
              {mech.label}
            </div>
          ))}

          {moments.map((moment) => (
            <Fragment key={moment.key}>
              <div
                style={{
                  ...sora,
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "var(--ink)",
                  padding: "10px 8px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {moment.label}
              </div>
              {mechanisms.map((mech) => {
                const cell = concepts.filter(
                  (c) => c.moment === moment.key && c.mechanism === mech.key
                );
                return (
                  <div
                    key={mech.key}
                    style={{
                      background: "rgba(255,255,255,0.4)",
                      border: "1px solid rgba(255,255,255,0.85)",
                      borderRadius: 14,
                      padding: 8,
                      minHeight: 64,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    {cell.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setError(null);
                          setPanel({ kind: "view", conceptId: c.id });
                        }}
                        title={c.title}
                        style={{
                          ...sora,
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          fontSize: "0.74rem",
                          fontWeight: 600,
                          lineHeight: 1.35,
                          padding: "6px 9px",
                          borderRadius: 10,
                          cursor: "pointer",
                          color: "var(--ink)",
                          border: c.chosen
                            ? "1px solid var(--ink)"
                            : "1px solid rgba(13,59,46,0.18)",
                          background: c.chosen
                            ? "linear-gradient(90deg, rgba(109,192,200,0.75), rgba(159,212,176,0.75))"
                            : "rgba(255,255,255,0.75)",
                          boxShadow: c.chosen
                            ? "0 4px 10px -4px rgba(13,59,46,0.45)"
                            : "none",
                        }}
                      >
                        {c.chosen ? "★ " : ""}
                        {c.title}
                        {c.source === "ai" && <AiBadge />}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setPanel({ kind: "add", moment: moment.key, mechanism: mech.key });
                      }}
                      aria-label={`Add concept: ${moment.label} × ${mech.label}`}
                      style={{
                        ...sora,
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "rgba(13,59,46,0.45)",
                        background: "transparent",
                        border: "1px dashed rgba(13,59,46,0.25)",
                        borderRadius: 10,
                        padding: "4px 0",
                        cursor: "pointer",
                        marginTop: "auto",
                      }}
                    >
                      +
                    </button>
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {/* ---------- side panel (view / add) ---------- */}
      {panel && (
        <>
          <div
            onClick={() => setPanel(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(13,59,46,0.25)",
              zIndex: 40,
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(420px, 100vw)",
              zIndex: 50,
              padding: 14,
              display: "flex",
            }}
          >
            <div className="glass" style={{ width: "100%", overflowY: "auto", padding: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div className="kicker" style={{ color: "var(--sky)", marginBottom: 16 }}>
                  {panel.kind === "view" && viewed
                    ? `${momentLabel(viewed.moment)} × ${mechanismLabel(viewed.mechanism)}`
                    : panel.kind === "add"
                      ? `${momentLabel(panel.moment)} × ${mechanismLabel(panel.mechanism)}`
                      : ""}
                </div>
                <button
                  type="button"
                  onClick={() => setPanel(null)}
                  aria-label="Close panel"
                  style={{
                    ...sora,
                    fontSize: "1rem",
                    fontWeight: 700,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(13,59,46,0.55)",
                  }}
                >
                  ✕
                </button>
              </div>

              {panel.kind === "view" && viewed ? (
                <>
                  <h3 style={{ fontSize: "1.25rem", marginBottom: 10 }}>
                    {viewed.title}
                    {viewed.source === "ai" && <AiBadge />}
                  </h3>
                  {viewed.description ? (
                    <p style={{ lineHeight: 1.7, marginBottom: 20 }}>{viewed.description}</p>
                  ) : (
                    <p className="muted small" style={{ marginBottom: 20 }}>
                      No description yet.
                    </p>
                  )}
                  <div className="btn-row" style={{ marginBottom: 14 }}>
                    <button
                      type="button"
                      className={viewed.chosen ? "btn btn-secondary" : "btn btn-primary"}
                      disabled={isPending}
                      onClick={() => runAction(() => toggleChosen(viewed.id, sprintId))}
                    >
                      {viewed.chosen ? "★ Chosen — remove from build" : "Choose for build"}
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={isPending || viewed.hasPrototype}
                    onClick={() => runAction(() => removeConcept(viewed.id, sprintId), true)}
                    title={
                      viewed.hasPrototype
                        ? "This concept already has a prototype — it can't be removed."
                        : "Remove this concept from the canvas"
                    }
                    style={{
                      ...sora,
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: viewed.hasPrototype ? "rgba(13,59,46,0.35)" : "var(--rose)",
                      background: "transparent",
                      border: "none",
                      cursor: viewed.hasPrototype ? "not-allowed" : "pointer",
                      padding: 0,
                      textDecoration: "underline",
                    }}
                  >
                    {viewed.hasPrototype ? "Prototyped — can't remove" : "Remove concept"}
                  </button>
                </>
              ) : panel.kind === "view" ? (
                <p className="muted">Concept no longer exists.</p>
              ) : null}

              {panel.kind === "add" && (
                <form action={handleAdd}>
                  <h3 style={{ fontSize: "1.15rem", marginBottom: 14 }}>New concept</h3>
                  <div className="field-full" style={{ marginTop: 0 }}>
                    <label htmlFor="canvas-title">Title (Dutch, faces the room)</label>
                    <input
                      id="canvas-title"
                      name="title"
                      type="text"
                      maxLength={90}
                      required
                      autoFocus
                      placeholder="bv. Verlofcheck in de app"
                    />
                  </div>
                  <div className="field-full">
                    <label htmlFor="canvas-desc">Description (1–2 sentences, Dutch)</label>
                    <textarea
                      id="canvas-desc"
                      name="description"
                      maxLength={600}
                      placeholder="Wat is het — en waarom nu?"
                      style={{ minHeight: 90 }}
                    />
                  </div>
                  <div className="btn-row" style={{ marginTop: 18 }}>
                    <button type="submit" className="btn btn-primary" disabled={isPending}>
                      {isPending ? "Adding…" : "Add concept"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setPanel(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {error && (
                <p className="small" style={{ color: "var(--rose)", fontWeight: 600, marginTop: 16, marginBottom: 0 }}>
                  {error}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
