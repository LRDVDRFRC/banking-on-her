"use client";

import { useState } from "react";

const SECTOR_OPTIONS: [string, string][] = [
  ["", "All sectors"],
  ["pensioen", "Pensioenuitvoerder"],
  ["bank", "Bank"],
  ["verzekeraar", "Verzekeraar"],
  ["vermogensbeheer", "Vermogensbeheerder"],
  ["hypotheek", "Hypotheekverstrekker"],
  ["algemeen", "Financiële instelling (algemeen)"],
];

const REGION_OPTIONS: [string, string][] = [
  ["", "All regions"],
  ["nl", "Nederland"],
  ["eu", "Europa"],
  ["global", "Wereldwijd"],
];

export default function AskLibrary({ enabled }: { enabled: boolean }) {
  const [question, setQuestion] = useState("");
  const [sector, setSector] = useState("");
  const [region, setRegion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [reportsUsed, setReportsUsed] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!enabled) {
    return (
      <section className="glass">
        <div className="kicker" style={{ color: "var(--amber)" }}>Not yet activated</div>
        <p>
          Ask the library needs an Anthropic API key. Set the{" "}
          <code>ANTHROPIC_API_KEY</code> environment variable (locally in{" "}
          <code>.env.local</code>, in production via Vercel → Settings →
          Environment Variables) and redeploy. The rest of the platform works
          without it.
        </p>
      </section>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || busy) return;
    setBusy(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, sector: sector || undefined, region: region || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status}).`);
      } else {
        setAnswer(data.answer);
        setReportsUsed(data.reportsUsed ?? null);
      }
    } catch {
      setError("Network error — is the server still running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} className="glass" style={{ marginBottom: 28 }}>
        <div className="kicker" style={{ color: "var(--sky)" }}>Ask a question</div>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder='e.g. "Hoe groot is de pensioenkloof in Nederland en wat zijn de belangrijkste oorzaken?" — or "What is the business case for serving women in wealth management?"'
          style={{ width: "100%", marginBottom: 16 }}
        />
        <div className="fields" style={{ marginBottom: 16 }}>
          <div className="field">
            <label htmlFor="ask-sector">Sector focus</label>
            <select id="ask-sector" value={sector} onChange={(e) => setSector(e.target.value)}>
              {SECTOR_OPTIONS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="ask-region">Region focus</label>
            <select id="ask-region" value={region} onChange={(e) => setRegion(e.target.value)}>
              {REGION_OPTIONS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="btn-row">
          <button type="submit" className="btn btn-primary" disabled={busy || !question.trim()}>
            {busy ? "Consulting the library…" : "Ask"}
          </button>
          <span className="muted small">Answers are grounded in the stored reports, with citations.</span>
        </div>
      </form>

      {error && (
        <section className="glass-sm" style={{ borderLeft: "3px solid var(--rose)", borderRadius: 0 }}>
          <p>{error}</p>
        </section>
      )}

      {answer && (
        <section className="glass">
          <div className="kicker" style={{ color: "var(--mint)" }}>
            Answer{reportsUsed !== null ? ` · grounded in ${reportsUsed} report${reportsUsed === 1 ? "" : "s"}` : ""}
          </div>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{answer}</div>
        </section>
      )}
    </>
  );
}
