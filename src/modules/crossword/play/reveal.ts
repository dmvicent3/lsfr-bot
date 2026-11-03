import { seedFor } from "../../../core/seed.ts";
import { EMPTY_CELL, fill, isFull, solutionOf } from "./cells.ts";
import { type PlayState, type Rec, isGame } from "./types.ts";

export const REVEAL_LINE = "🔎 Revealed a letter";

/** The player's random(), advanced once per reveal already made: the same game, the same cells. */
export function revealRandom(rec: Rec): () => number {
  const random = seedFor(rec.userId, isGame(rec) ? rec.date : String(rec.startedAt));

  for (let i = 0; i < rec.reveals; i++) random();

  return random;
}

/** Fills one empty cell chosen by `random`; a full board is left as it is. */
export function reveal(
  state: PlayState,
  random: () => number,
): { cells: string; reveals: number; done: boolean } {
  const { puzzle, cells, reveals } = state;
  const empty = cells.split("").flatMap((c, i) => (c === EMPTY_CELL ? [i] : []));

  if (empty.length === 0) return { cells, reveals, done: true };

  const cell = empty[Math.floor(random() * empty.length)]!;
  const next = fill(cells, [cell], solutionOf(puzzle)[cell]!);

  return { cells: next, reveals: reveals + 1, done: isFull(next) };
}
