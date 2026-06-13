"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** ISO timestamp → "2026-06-11 09:42 UTC" — deterministic, so SSR and client agree. */
function formatRunAt(iso: string): string {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(iso);
  return m ? `${m[1]} ${m[2]} UTC` : iso;
}

/**
 * Button that kicks off the morning readout synthesis
 * (POST /dashboard/[id]/readout/generate) and refreshes the page when the
 * readout lands. One Claude call over all of last evening's feedback rows.
 */
export default function ReadoutTrigger({
  sprintId,
  hasReadout,
  readoutAt,
  enabled,
}: {
  sprintId: string;
  hasReadout: boolean;
  readoutAt: string | null;
  enabled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!enabled) {
    return (
      <p className="muted small no-print" style={{ marginBottom: 18 }}>
        The readout synthesis needs an Anthropic API key. Set the{" "}
        <code>ANTHROPIC_API_KEY</code> environment variable (locally in{" "}
        <code>.env.local</code>, in production via Vercel → Settings →
        Environment Variables) and restart. The captured feedback itself is
        safe in the database either way.
      </p>
    );
  }

  async function run() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/dashboard/${sprintId}/readout/generate`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status}).`);
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error — is the server still running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="no-print" style={{ marginBottom: 18 }}>
      <div className="btn-row">
        <button type="button" className="btn btn-primary" onClick={run} disabled={busy}>
          {busy
            ? "Synthesizing…"
            : hasReadout
              ? "Re-synthesize readout (AI, ~30s)"
              : "Synthesize readout (AI, ~30s)"}
        </button>
        {hasReadout && readoutAt && !busy ? (
          <span className="muted small">Last run: {formatRunAt(readoutAt)}</span>
        ) : null}
      </div>
      {busy ? (
        <p className="muted small" style={{ marginTop: 12, marginBottom: 0 }}>
          Reading every panel reaction and writing the ranking + recommendation
          — about half a minute. Keep this tab open; the page refreshes when
          the readout lands.
        </p>
      ) : null}
      {error ? (
        <p className="small" style={{ marginTop: 12, marginBottom: 0, color: "var(--rose)", fontWeight: 600 }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
