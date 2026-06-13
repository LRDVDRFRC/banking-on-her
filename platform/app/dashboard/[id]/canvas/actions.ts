"use server";

// Server actions for the Phase-4 ideation canvas ONLY (app/actions.ts holds
// the rest of the app's actions). Each action validates against the sprint's
// own grid axes (lib/moments.ts) and revalidates the canvas path.

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db, ensureSchema } from "@/lib/db";
import { isMechanismKey, isMomentKey } from "@/lib/moments";

export interface CanvasActionResult {
  ok: boolean;
  error?: string;
}

const TITLE_MAX = 90;
const DESC_MAX = 600;

/** Sprint's sector key (default pensioen), or null when the sprint is unknown. */
async function sprintSector(sprintId: string): Promise<string | null> {
  const res = await db().execute({
    sql: "SELECT sector FROM sprints WHERE id = ?",
    args: [sprintId],
  });
  if (res.rows.length === 0) return null;
  return res.rows[0].sector == null ? "pensioen" : String(res.rows[0].sector);
}

/** Room-sourced concept onto one (moment, mechanism) cell of the grid. */
export async function addConcept(
  sprintId: string,
  input: { title: string; moment: string; mechanism: string; description: string }
): Promise<CanvasActionResult> {
  await ensureSchema();
  const sector = await sprintSector(sprintId);
  if (sector === null) return { ok: false, error: "Sprint not found." };

  const title = input.title.trim().slice(0, TITLE_MAX);
  const description = input.description.trim().slice(0, DESC_MAX);
  if (!title) return { ok: false, error: "Give the concept a title (Dutch — it faces the room)." };
  if (!isMomentKey(sector, input.moment) || !isMechanismKey(input.mechanism)) {
    return { ok: false, error: "Unknown moment or mechanism for this sprint's grid." };
  }

  await db().execute({
    sql: `INSERT INTO concepts (id, sprint_id, title, moment, mechanism, description, source, chosen, created_at)
          VALUES (?, ?, ?, ?, ?, ?, 'room', 0, ?)`,
    args: [
      `con_${randomBytes(6).toString("hex")}`,
      sprintId,
      title,
      input.moment,
      input.mechanism,
      description || null,
      new Date().toISOString(),
    ],
  });
  revalidatePath(`/dashboard/${sprintId}/canvas`);
  return { ok: true };
}

/** Flip a concept in or out of the 3–5 "build this afternoon" selection. */
export async function toggleChosen(
  conceptId: string,
  sprintId: string
): Promise<CanvasActionResult> {
  await ensureSchema();
  const res = await db().execute({
    sql: "UPDATE concepts SET chosen = CASE WHEN chosen = 1 THEN 0 ELSE 1 END WHERE id = ? AND sprint_id = ?",
    args: [conceptId, sprintId],
  });
  if (res.rowsAffected === 0) return { ok: false, error: "Concept not found." };
  revalidatePath(`/dashboard/${sprintId}/canvas`);
  return { ok: true };
}

/**
 * Remove a concept — only while it has no prototype yet. Once Phase 5 built
 * a prototype the concept carries test data and stays.
 */
export async function removeConcept(
  conceptId: string,
  sprintId: string
): Promise<CanvasActionResult> {
  await ensureSchema();
  const res = await db().execute({
    sql: "DELETE FROM concepts WHERE id = ? AND sprint_id = ? AND prototype_json IS NULL",
    args: [conceptId, sprintId],
  });
  if (res.rowsAffected === 0) {
    return { ok: false, error: "Not removed — concept not found, or it already has a prototype." };
  }
  revalidatePath(`/dashboard/${sprintId}/canvas`);
  return { ok: true };
}
