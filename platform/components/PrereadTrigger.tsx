"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** ISO timestamp → "2026-06-11 09:42 UTC" — deterministic, so SSR and client agree. */
function formatRunAt(iso: string): string {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(iso);
  return m ? `${m[1]} ${m[2]} UTC` : iso;
}

/**
 * Button that composes (or re-composes) the Dutch pre-read for a sprint
 * (POST /dashboard/[id]/preread) and refreshes the page when it lands.
 */
export default function PrereadTrigger({
  sprintId,
  hasDoc,
  docAt,
  enabled,
}: {
  sprintId: string;
  hasDoc: boolean;
  docAt: string | null;
  enabled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!enabled) {
    return (
      <p className="muted small no-print" style={{ marginBottom: 18 }}>
        Composing the pre-read needs an Anthropic API key (
        <code>ANTHROPIC_API_KEY</code>).
      </p>
    );
  }

  async function run() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/dashboard/${sprintId}/preread`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status}).`);
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="no-print" style={{ marginBottom: 18 }}>
      <div className="btn-row">
        <button type="button" className="btn btn-primary" onClick={run} disabled={busy}>
          {busy
            ? "Composing the pre-read…"
            : hasDoc
              ? "Re-compose pre-read (AI, ~20s)"
              : "Compose pre-read (AI, ~20s)"}
        </button>
        {hasDoc && docAt && (
          <span className="muted small">last composed {formatRunAt(docAt)}</span>
        )}
      </div>
      {error && (
        <p className="small" style={{ color: "var(--rose)", marginTop: 10 }}>{error}</p>
      )}
    </div>
  );
}
