import { DAILY_LEVEL, type Game, type Level } from "../types.ts";

/** The level a daily opens at, and the note when the player asked for another one. */
export interface Pick {
  level: Level;
  note: string | null;
}

/**
 * One daily a day: the first open picks its level (`asked`, else medium); later opens reopen
 * that board whatever is asked.
 */
export function pickDaily(today: Game | null, asked: Level | null): Pick {
  if (!today) return { level: asked ?? DAILY_LEVEL, note: null };

  const switched = asked !== null && asked !== today.level;
  const note = switched
    ? `You're on ${today.level} today: one daily a day. Every level is in /sudoku practice.`
    : null;

  return { level: today.level, note };
}
