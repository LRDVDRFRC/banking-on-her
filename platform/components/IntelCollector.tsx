"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

function fmt(iso: string): string {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(iso);
  return m ? `${m[1]} ${m[2]} UTC` : iso;
}

/**
 * Auto-collects market + media intel and harvests reports into the library when
 * a sprint has none yet (fires once on mount), shows progress, and refreshes the
 * page when it lands. Once collected, offers a manual re-run.
 */
export default function IntelCollector({
  sprintId,
  collectedAt,
  enabled,
}: {
  sprintId: string;
  collectedAt: string | null;
  enabled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const fired = useRef(false);

  async function run() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/dashboard/${sprintId}/intel`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? `Verzamelen mislukt (${res.status}).`);
      } else {
        setResult(`Klaar — ${data.reportsAdded ?? 0} rapporten aan de bibliotheek toegevoegd.`);
        router.refresh();
      }
    } catch {
      setError("Netwerkfout — probeer opnieuw.");
    } finally {
      setBusy(false);
    }
  }

  // Auto-fire once for a fresh sprint with no intel yet.
  useEffect(() => {
    if (enabled && !collectedAt && !fired.current) {
      fired.current = true;
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!enabled) {
    return (
      <section className="glass-sm no-print" style={{ marginBottom: 28 }} aria-label="Intel">
        <div className="kicker" style={{ color: "var(--amber)" }}>Intel</div>
        <p style={{ marginBottom: 0 }}>
          Automatische intel (markt, media &amp; rapporten) heeft een Anthropic API-sleutel
          nodig (<code>ANTHROPIC_API_KEY</code>). De rest werkt zonder.
        </p>
      </section>
    );
  }

  return (
    <section className="glass-sm no-print" style={{ marginBottom: 28 }} aria-label="Intel">
      <div className="kicker" style={{ color: "var(--sky)" }}>Intel</div>
      {busy ? (
        <p style={{ marginBottom: 0 }}>
          <span className="intel-spin" aria-hidden="true" /> Intel wordt verzameld — markt,
          media en recente rapporten over deze sector. Dit duurt ~1–2 minuten; de findings
          vullen zich vanzelf.
        </p>
      ) : collectedAt ? (
        <div className="btn-row" style={{ alignItems: "center" }}>
          <span className="muted small">
            Intel verzameld op {fmt(collectedAt)}. Staat in de{" "}
            <a href={`/dashboard/${sprintId}/findings`}>findings</a> en de{" "}
            <a href="/research">bibliotheek</a>.
          </span>
          <button type="button" className="btn" onClick={run}>Opnieuw verzamelen</button>
        </div>
      ) : (
        <div className="btn-row" style={{ alignItems: "center" }}>
          <button type="button" className="btn btn-primary" onClick={run}>
            Verzamel intel (markt · media · rapporten)
          </button>
          <span className="muted small">Duurt ~1–2 minuten.</span>
        </div>
      )}
      {result && <p className="small" style={{ color: "var(--ink)", marginTop: 10, marginBottom: 0 }}>{result}</p>}
      {error && <p className="small" style={{ color: "var(--rose)", marginTop: 10, marginBottom: 0 }}>{error}</p>}
    </section>
  );
}
