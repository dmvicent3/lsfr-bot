import type { Clicker, NewCheck, Reminder, Target } from "./types.ts";

export const MAX_PENDING = 25;
export const MAX_TEXT = 500;
const MIN_AHEAD = 60_000;
const MAX_AHEAD = 365 * 24 * 3_600_000;
/** Sent later than this after due, the message says how late. */
const LATE_AFTER = 120_000;

/** Why a new reminder can't be set, or null when it can. */
export function checkNew({ at, now, text, pending }: NewCheck): string | null {
  if (at - now < MIN_AHEAD) return "Pick a time at least 1 minute from now.";

  if (at - now > MAX_AHEAD) return "Pick a time within a year.";

  if (text.trim() === "" || text.length > MAX_TEXT)
    return `Keep the text to 1-${MAX_TEXT} characters.`;

  if (pending >= MAX_PENDING) {
    return `You already have ${MAX_PENDING} reminders here. Cancel one in \`/remind list\` first.`;
  }

  return null;
}

/** The @everyone role shares the server's id. */
export function refusedTarget(target: Target, guildId: string): boolean {
  return target.kind === "role" && target.id === guildId;
}

/** The author, the target member, or anyone holding the target role. */
export function canAct(r: Reminder, c: Clicker): boolean {
  if (c.id === r.authorId) return true;

  if (r.target.kind === "user") return c.id === r.target.id;

  return c.roleIds.includes(r.target.id);
}

/** How late a reminder went out, or null when it was close enough to on time. */
export function lateBy(dueAt: number, sentAt: number): number | null {
  const late = sentAt - dueAt;

  return late > LATE_AFTER ? late : null;
}
