import type { MultiGame, MultiPuzzle } from "./types.ts";

/** A player's game on `puzzle` before their first guess. */
export const openMulti = (puzzle: MultiPuzzle, userId: string): MultiGame => ({
  guildId: puzzle.guildId,
  mode: puzzle.mode,
  date: puzzle.date,
  userId,
  guesses: [],
  won: null,
  found: null,
  points: null,
  streak: null,
  finishedAt: null,
});

/** The player's stored game on `puzzle`, or a fresh one. */
export const gameOn = (
  games: { get(k: Pick<MultiGame, "guildId" | "mode" | "date" | "userId">): MultiGame | null },
  puzzle: MultiPuzzle,
  userId: string,
): MultiGame => games.get({ ...puzzle, userId }) ?? openMulti(puzzle, userId);
