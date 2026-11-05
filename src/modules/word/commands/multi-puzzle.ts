import { MODES } from "../multi/modes.ts";
import { todayMulti } from "../multi/today.ts";
import type { Mode, MultiPuzzle } from "../multi/types.ts";
import { wordSettings } from "../settings.ts";
import type { CommandCtx } from "./types.ts";

/** Today's puzzle for `mode` with the server's time zone; null when the word list ran short. */
export function modePuzzle(
  { guildId, db, repo, random }: CommandCtx,
  mode: Mode,
): { puzzle: MultiPuzzle; timeZone: string; now: number } | null {
  const settings = wordSettings(db, guildId);
  const now = Date.now();
  const puzzle = todayMulti(repo, { guildId, settings, now, random }, mode);

  return puzzle.words.length < MODES[mode].boards
    ? null
    : { puzzle, timeZone: settings.timeZone, now };
}

export const NO_WORDS = "No words for today's puzzle.";
