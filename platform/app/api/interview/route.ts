import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db, ensureSchema } from "@/lib/db";
import { sectorLabel } from "@/lib/sectors";

export const dynamic = "force-dynamic";

// AI intake interview — client-facing route. Middleware basic auth does NOT
// cover /api/interview: the sprint token + participant id ARE the auth, the
// same model as the /s/[token]/* pages.

const MAX_QUESTIONS = 6;
const MAX_MESSAGES = 30;
const MAX_MESSAGE_CHARS = 4000;

type ChatRole = "ai" | "user";
interface ChatMessage {
  role: ChatRole;
  text: string;
}

function isChatMessage(v: unknown): v is ChatMessage {
  return (
    typeof v === "object" &&
    v !== null &&
    "role" in v &&
    "text" in v &&
    ((v as { role: unknown }).role === "ai" || (v as { role: unknown }).role === "user") &&
    typeof (v as { text: unknown }).text === "string"
  );
}

function chatSystemPrompt(opts: {
  client: string;
  sector: string;
  name: string;
  role: string | null;
  prework: string | null;
  asked: number;
}): string {
  const { client, sector, name, role, prework, asked } = opts;
  const preworkLine = prework?.trim()
    ? `"${prework.trim()}"`
    : "(geen antwoord gegeven — open dan met de vraag waar ze zelf denken dat de kans zit)";

  let prompt = `Je bent de intake-interviewer van Unlockt voor de 24-uur propositie sprint bij ${client} (${sector}). Unlockt helpt financiële instellingen meer waarde te halen uit vrouwelijke klanten — altijd vanuit de commerciële kans, nooit vanuit moralisme.

Je spreekt met ${name}${role ? ` (${role})` : ""}. In de intake schreef ${name} dit als antwoord op de vraag waar ${client} geld laat liggen voor vrouwelijke klanten:
${preworkLine}

Doel van het gesprek, in volgorde van prioriteit:
1. Scherper krijgen waar ${client} geld laat liggen voor vrouwelijke klanten — bouw direct voort op het intake-antwoord hierboven.
2. EEN concreet klantverhaal of moment dat ${name} zelf heeft meegemaakt of gezien.
3. De grootste interne barrière die niemand hardop benoemt.
4. Wat er al geprobeerd is en waarom het strandde.
5. Wat de sprint voor ${name} persoonlijk tot een succes maakt.

Regels:
- Stel EEN vraag per keer. Houd je vragen kort.
- Warm en direct, geen jargon, geen complimenten als opvulling.
- Vraag door op vage antwoorden ("kun je een concreet voorbeeld geven?").
- Maximaal ${MAX_QUESTIONS} vragen in het hele gesprek — kies dus scherp; je hoeft niet elk doel te halen.
- Is dit de eerste beurt (lege geschiedenis)? Open dan met een vraag die direct verwijst naar wat ${name} in de intake schreef.
- Na het laatste antwoord: bedank ${name} in 1-2 zinnen en zet helemaal aan het einde letterlijk de marker [KLAAR].

Tot nu toe heb je ${asked} van de maximaal ${MAX_QUESTIONS} vragen gesteld.`;

  if (asked >= MAX_QUESTIONS) {
    prompt += `\n\nJe hebt het maximum aantal vragen bereikt. Stel GEEN nieuwe vraag meer: bedank ${name} nu in 1-2 zinnen en eindig met [KLAAR].`;
  }
  return prompt;
}

function finalizeSystemPrompt(opts: {
  client: string;
  sector: string;
  name: string;
  role: string | null;
  prework: string | null;
}): string {
  const { client, sector, name, role, prework } = opts;
  return `You are preparing facilitator notes for Unlockt's 24-hour proposition sprint at ${client} (${sector}). You will receive the transcript of a short AI intake interview with crew member ${name}${role ? ` (${role})` : ""}. Their written pre-work answer was: "${prework?.trim() || "(none given)"}".

Produce JSON with exactly these fields:
- "summary": ~120 words, in ENGLISH, for the facilitators. Cover: their view of the commercial opportunity ${client} is missing with women clients, the concrete client story or moment they shared, the internal barrier they named, what has been tried and why it stalled, and what success means to them personally. Be specific — facts and phrasing from the transcript, no filler.
- "highlights": an array of 3 to 5 short DUTCH quotes, verbatim or near-verbatim, taken ONLY from the participant's own answers (never from the interviewer's questions). Pick the lines a facilitator would put on a slide: vivid, concrete, revealing.`;
}

/** Extract joined text from a Claude response. */
function responseText(response: Anthropic.Message): string {
  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  let body: { token?: unknown; participant?: unknown; mode?: unknown; messages?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const token = typeof body.token === "string" ? body.token : "";
  const participantId = typeof body.participant === "string" ? body.participant : "";
  const mode = body.mode;
  if (!token || !participantId) return jsonError("token and participant are required.", 400);
  if (mode !== "chat" && mode !== "finalize") {
    return jsonError('mode must be "chat" or "finalize".', 400);
  }

  const rawMessages = body.messages ?? [];
  if (!Array.isArray(rawMessages) || !rawMessages.every(isChatMessage)) {
    return jsonError("messages must be an array of {role: 'ai'|'user', text} objects.", 400);
  }
  if (rawMessages.length > MAX_MESSAGES) {
    return jsonError(`Transcript too long (max ${MAX_MESSAGES} messages).`, 400);
  }
  if (rawMessages.some((m) => m.text.length > MAX_MESSAGE_CHARS)) {
    return jsonError(`Message too long (max ${MAX_MESSAGE_CHARS} characters).`, 400);
  }
  const messages: ChatMessage[] = rawMessages.map((m) => ({ role: m.role, text: m.text.trim() }));

  await ensureSchema();
  const c = db();

  const sprintRes = await c.execute({
    sql: "SELECT id, client, sector FROM sprints WHERE token = ?",
    args: [token],
  });
  if (sprintRes.rows.length === 0) return jsonError("Unknown sprint.", 404);
  const sprintId = String(sprintRes.rows[0].id);
  const client = String(sprintRes.rows[0].client);
  const sector = sectorLabel(
    sprintRes.rows[0].sector == null ? null : String(sprintRes.rows[0].sector)
  );

  const participantRes = await c.execute({
    sql: "SELECT id, name, role, prework, interview_json FROM participants WHERE id = ? AND sprint_id = ?",
    args: [participantId, sprintId],
  });
  if (participantRes.rows.length === 0) return jsonError("Unknown participant.", 404);
  const row = participantRes.rows[0];
  const name = String(row.name);
  const role = row.role == null ? null : String(row.role);
  const prework = row.prework == null ? null : String(row.prework);
  const alreadyCompleted = row.interview_json != null;

  if (alreadyCompleted) {
    // Both modes refuse once the interview is stored — never overwrite.
    return jsonError("already completed", 409);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonError(
      "Het AI-gesprek is op dit moment niet beschikbaar (geen API-sleutel geconfigureerd).",
      503
    );
  }

  const anthropic = new Anthropic();

  try {
    if (mode === "chat") {
      // A trailing assistant turn would be a prefill (400 on this model) —
      // the transcript must end with the participant's answer.
      if (messages.length > 0 && messages[messages.length - 1].role !== "user") {
        return jsonError("Transcript must end with a user message.", 400);
      }
      const asked = messages.filter((m) => m.role === "ai").length;

      const history: Anthropic.MessageParam[] = [
        { role: "user", content: "(Het gesprek start nu. Stel je openingsvraag.)" },
        ...messages.map(
          (m): Anthropic.MessageParam => ({
            role: m.role === "ai" ? "assistant" : "user",
            content: m.text,
          })
        ),
      ];

      const response = await anthropic.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 1024,
        thinking: { type: "adaptive" },
        system: chatSystemPrompt({ client, sector, name, role, prework, asked }),
        messages: history,
      });

      const raw = responseText(response);
      if (!raw) return jsonError("The model returned an empty reply.", 502);

      // Hard server-side stop: past the question cap the conversation is done
      // even if the model forgot the marker.
      const done = raw.includes("[KLAAR]") || asked >= MAX_QUESTIONS;
      const reply = raw.replaceAll("[KLAAR]", "").trim();
      return NextResponse.json({ reply, done });
    }

    // mode === "finalize"
    if (!messages.some((m) => m.role === "user") || messages.length < 2) {
      return jsonError("Finalize requires a transcript with at least one answer.", 400);
    }

    const transcriptText = messages
      .map((m) => `${m.role === "ai" ? "Interviewer" : name}: ${m.text}`)
      .join("\n\n");

    const response = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      thinking: { type: "adaptive" },
      system: finalizeSystemPrompt({ client, sector, name, role, prework }),
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              summary: {
                type: "string",
                description:
                  "~120-word English summary for the facilitators: opportunity, story, barrier, what was tried, personal success criteria.",
              },
              highlights: {
                type: "array",
                items: { type: "string" },
                description:
                  "3-5 short Dutch verbatim or near-verbatim quotes from the participant's own answers.",
              },
            },
            required: ["summary", "highlights"],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: "user",
          content: `Transcript of the interview:\n\n${transcriptText}`,
        },
      ],
    });

    const raw = responseText(response);
    let parsed: { summary?: unknown; highlights?: unknown };
    try {
      parsed = JSON.parse(raw) as { summary?: unknown; highlights?: unknown };
    } catch {
      // Fallback: pull the outermost JSON object out of the text.
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return jsonError("The model did not return valid JSON.", 502);
      parsed = JSON.parse(match[0]) as { summary?: unknown; highlights?: unknown };
    }

    const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
    const highlights = Array.isArray(parsed.highlights)
      ? parsed.highlights.filter((h): h is string => typeof h === "string" && h.trim() !== "")
      : [];
    if (!summary || highlights.length === 0) {
      return jsonError("The model returned an incomplete result.", 502);
    }

    await c.execute({
      sql: "UPDATE participants SET interview_json = ? WHERE id = ?",
      args: [
        JSON.stringify({
          completedAt: new Date().toISOString(),
          summary,
          highlights,
          transcript: messages,
        }),
        participantId,
      ],
    });

    return NextResponse.json({ ok: true, summary, highlights });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return jsonError("The configured ANTHROPIC_API_KEY was rejected.", 503);
    }
    if (error instanceof Anthropic.RateLimitError) {
      return jsonError("Rate limited — try again in a moment.", 429);
    }
    if (error instanceof Anthropic.APIError) {
      return jsonError(`Claude API error (${error.status}).`, 502);
    }
    throw error;
  }
}
