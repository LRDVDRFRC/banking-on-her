"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** ISO timestamp → "2026-06-11 09:42 UTC" — deterministic, so SSR and client agree. */
function formatRunAt(iso: string): string {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(iso);
  return m ? `${m[1]} ${m[2]} UTC` : iso;
}

/**
 * Button that kicks off the deep-research run for a sprint
 * (POST /dashboard/[id]/research) and refreshes the page when the brief lands.
 * The run is one long web-search-backed Claude call, so the busy state is
 * explicit about the wait.
 */
export default function ResearchTrigger({
  sprintId,
  hasBrief,
  briefAt,
  enabled,
}: {
  sprintId: string;
  hasBrief: boolean;
  briefAt: string | null;
  enabled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!enabled) {
    return (
      <p className="muted small no-print" style={{ marginBottom: 18 }}>
        Deep research needs an Anthropic API key. Set the{" "}
        <code>ANTHROPIC_API_KEY</code> environment variable (locally in{" "}
        <code>.env.local</code>, in production via Vercel → Settings →
        Environment Variables) and restart. The rest of the findings page works
        without it.
      </p>
    );
  }

  async function run() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/dashboard/${sprintId}/research`, { method: "POST" });
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
            ? "Researching…"
            : hasBrief
              ? "Re-run deep research (≈2–3 min)"
              : "Run deep research (≈2–3 min)"}
        </button>
        {hasBrief && briefAt && !busy ? (
          <span className="muted small">Last run: {formatRunAt(briefAt)}</span>
        ) : null}
      </div>
      {busy ? (
        <p className="muted small" style={{ marginTop: 12, marginBottom: 0 }}>
          Researching the client and market — this takes a couple of minutes.
          Keep this tab open; the section refreshes when the brief lands.
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
