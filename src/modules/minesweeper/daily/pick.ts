import type { Game, Preset } from "../types.ts";

/** The level a daily opens at when none is asked for. */
export const DAILY_LEVEL: Preset = "intermediate";

/** The level a daily opens at, and the note when the player asked for another one. */
export interface Pick {
  level: Preset;
  note: string | null;
}

/**
 * One daily a day: the first open picks its level (`asked`, else intermediate); later opens
 * reopen that board whatever is asked.
 */
export function pickDaily(today: Game | null, asked: Preset | null): Pick {
  const level = today?.level ?? null;

  if (!today || !level) return { level: asked ?? DAILY_LEVEL, note: null };

  const switched = asked !== null && asked !== level;
  const note = switched
    ? `You're on ${level} today: one daily a day. Any size is in /minesweeper play.`
    : null;

  return { level, note };
}
