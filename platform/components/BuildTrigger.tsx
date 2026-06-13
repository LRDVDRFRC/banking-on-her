"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** ISO timestamp → "2026-06-11 09:42 UTC" — deterministic, so SSR and client agree. */
function formatRunAt(iso: string): string {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(iso);
  return m ? `${m[1]} ${m[2]} UTC` : iso;
}

/**
 * Button that kicks off the Phase-5 prototype build for one concept
 * (POST /dashboard/[id]/concepts/[conceptId]/build) and refreshes the page
 * when the package lands. Same pattern as ResearchTrigger.
 */
export default function BuildTrigger({
  sprintId,
  conceptId,
  hasPrototype,
  builtAt,
  enabled,
}: {
  sprintId: string;
  conceptId: string;
  hasPrototype: boolean;
  builtAt: string | null;
  enabled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!enabled) {
    return (
      <p className="muted small no-print" style={{ marginBottom: 18 }}>
        The prototype builder needs an Anthropic API key. Set the{" "}
        <code>ANTHROPIC_API_KEY</code> environment variable (locally in{" "}
        <code>.env.local</code>, in production via Vercel → Settings →
        Environment Variables) and restart.
      </p>
    );
  }

  async function run() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/dashboard/${sprintId}/concepts/${conceptId}/build`, {
        method: "POST",
      });
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
            ? "Building…"
            : hasPrototype
              ? "Rebuild prototype (AI, ~30s)"
              : "Build prototype (AI, ~30s)"}
        </button>
        {hasPrototype && builtAt && !busy ? (
          <span className="muted small">Last built: {formatRunAt(builtAt)}</span>
        ) : null}
      </div>
      {busy ? (
        <p className="muted small" style={{ marginTop: 12, marginBottom: 0 }}>
          Generating the value proposition, the phone mock and the test script
          in one go — keep this tab open; the pod refreshes when it lands.
        </p>
      ) : null}
      {error ? (
        <p
          className="small"
          style={{ marginTop: 12, marginBottom: 0, color: "var(--rose)", fontWeight: 600 }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
