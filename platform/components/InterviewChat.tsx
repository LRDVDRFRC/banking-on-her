"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Client for the AI intake interview. Drives /api/interview:
//   chat:     { token, participant, mode: "chat", messages } → { reply, done }
//             (messages = full history of {role:'ai'|'user', text}, must end on 'user';
//              empty history → the AI opens with its first question)
//   finalize: { token, participant, mode: "finalize", messages } → { ok, summary, highlights }
// The route strips the [KLAAR] marker server-side and signals completion via `done`;
// we strip defensively anyway. 409 = interview already stored → treat as done.

const MAX_INPUT_CHARS = 600;

interface ChatMsg {
  role: "ai" | "user";
  text: string;
}

type Status = "boot" | "ready" | "busy" | "finalizing" | "done";

const BUBBLE_AI: React.CSSProperties = {
  alignSelf: "flex-start",
  maxWidth: "85%",
  background: "rgba(109,192,200,0.16)",
  border: "1px solid rgba(109,192,200,0.4)",
  color: "var(--ink)",
  borderRadius: "16px 16px 16px 4px",
  padding: "12px 16px",
  fontSize: "1rem",
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
};

const BUBBLE_USER: React.CSSProperties = {
  alignSelf: "flex-end",
  maxWidth: "85%",
  background: "var(--ink)",
  border: "1px solid var(--ink)",
  color: "#fff",
  borderRadius: "16px 16px 4px 16px",
  padding: "12px 16px",
  fontSize: "1rem",
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
};

export default function InterviewChat({
  token,
  participantId,
  participantName,
}: {
  token: string;
  participantId: string;
  participantName: string;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("boot");
  const [error, setError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const booted = useRef(false);
  // The action to re-run when the user hits "Probeer opnieuw".
  const retryRef = useRef<(() => void) | null>(null);

  const post = useCallback(
    async (mode: "chat" | "finalize", history: ChatMsg[]) => {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, participant: participantId, mode, messages: history }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        reply?: string;
        done?: boolean;
        ok?: boolean;
        error?: string;
      };
      return { status: res.status, ok: res.ok, data };
    },
    [token, participantId]
  );

  const finalize = useCallback(
    async (transcript: ChatMsg[]) => {
      setStatus("finalizing");
      setError(null);
      try {
        const { status: code, ok } = await post("finalize", transcript);
        if (ok || code === 409) {
          // 409 = already stored (e.g. a retry after a slow success) — also done.
          setStatus("done");
          return;
        }
        throw new Error(String(code));
      } catch {
        retryRef.current = () => finalize(transcript);
        setError(
          "Het opslaan van het gesprek lukte even niet. Je antwoorden staan nog hieronder — probeer het zo opnieuw."
        );
        setStatus("ready");
      }
    },
    [post]
  );

  const advance = useCallback(
    async (history: ChatMsg[]) => {
      setStatus(history.length === 0 ? "boot" : "busy");
      setError(null);
      try {
        const { status: code, ok, data } = await post("chat", history);
        if (code === 409) {
          // Interview already completed for this participant.
          setStatus("done");
          return;
        }
        if (!ok || typeof data.reply !== "string") throw new Error(String(code));

        const reply = data.reply.replaceAll("[KLAAR]", "").trim();
        const next = reply ? [...history, { role: "ai" as const, text: reply }] : history;
        setMessages(next);

        if (data.done) {
          await finalize(next);
        } else {
          setStatus("ready");
        }
      } catch {
        retryRef.current = () => advance(history);
        setError(
          history.length === 0
            ? "Het gesprek kon niet starten. Even ademhalen en probeer het opnieuw."
            : "Je antwoord kwam niet aan. Probeer het zo nog een keer — er gaat niets verloren."
        );
        setStatus(history.length === 0 ? "boot" : "ready");
      }
    },
    [post, finalize]
  );

  // Kick off: empty history → the AI asks its opening question.
  // Ref guard so React 18 strict-mode dev double-mount fires only one request.
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    void advance([]);
  }, [advance]);

  // Keep the latest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  const send = () => {
    const text = input.trim();
    if (!text || status !== "ready") return;
    const history = [...messages, { role: "user" as const, text }];
    setMessages(history);
    setInput("");
    void advance(history);
  };

  const thinking = status === "boot" || status === "busy" || status === "finalizing";
  const canType = status === "ready" && error === null;

  return (
    <section className="glass" aria-label="Het gesprek" style={{ maxWidth: 720 }}>
      <div className="kicker" style={{ color: "var(--sky)" }}>
        Gesprek met de intake-interviewer
      </div>

      <div
        ref={listRef}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxHeight: 420,
          overflowY: "auto",
          padding: "4px 2px 12px",
          scrollBehavior: "smooth",
        }}
      >
        {messages.map((m, i) => (
          <div key={i} style={m.role === "ai" ? BUBBLE_AI : BUBBLE_USER}>
            {m.text}
          </div>
        ))}

        {thinking ? (
          <div
            style={{
              ...BUBBLE_AI,
              fontStyle: "italic",
              color: "rgba(13,59,46,0.55)",
              background: "rgba(109,192,200,0.08)",
            }}
            aria-live="polite"
          >
            {status === "finalizing" ? "even opslaan…" : "schrijft…"}
          </div>
        ) : null}
      </div>

      {error ? (
        <div
          role="alert"
          style={{
            marginTop: 12,
            padding: "12px 16px",
            borderRadius: 14,
            background: "rgba(245,184,150,0.18)",
            border: "1px solid rgba(245,184,150,0.55)",
            fontSize: "0.95rem",
          }}
        >
          <p style={{ marginBottom: 10 }}>{error}</p>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: "8px 18px", fontSize: "0.85rem" }}
            onClick={() => {
              setError(null);
              retryRef.current?.();
            }}
          >
            Probeer opnieuw
          </button>
        </div>
      ) : null}

      {status === "done" ? (
        <div
          style={{
            marginTop: 16,
            padding: "16px 20px",
            borderRadius: 16,
            background: "rgba(159,212,176,0.2)",
            border: "1px solid rgba(159,212,176,0.6)",
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: 4 }}>
            Bedankt — dit was de laatste stap van de intake.
          </p>
          <p className="muted small">
            Je antwoorden gaan naar de facilitator, {participantName}. Tot op de
            sprintdag!
          </p>
        </div>
      ) : (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <textarea
              value={input}
              maxLength={MAX_INPUT_CHARS}
              disabled={!canType}
              placeholder={canType ? "Typ je antwoord…" : "Even geduld…"}
              aria-label="Jouw antwoord"
              rows={2}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              style={{
                flex: 1,
                fontFamily: "'Inter', sans-serif",
                fontSize: "1rem",
                color: "var(--ink)",
                background: "rgba(255,255,255,0.65)",
                border: "1px solid rgba(13,59,46,0.18)",
                borderRadius: 14,
                padding: "12px 16px",
                outline: "none",
                resize: "none",
                lineHeight: 1.5,
              }}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={send}
              disabled={!canType || input.trim() === ""}
              style={{ padding: "12px 22px" }}
            >
              Stuur
            </button>
          </div>
          <p className="muted small" style={{ marginTop: 8 }}>
            Enter verstuurt · Shift+Enter voor een nieuwe regel
            {input.length > MAX_INPUT_CHARS - 100
              ? ` · nog ${MAX_INPUT_CHARS - input.length} tekens`
              : ""}
          </p>
        </div>
      )}
    </section>
  );
}
