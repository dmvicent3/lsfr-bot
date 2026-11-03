import { seedFor } from "../../../core/seed.ts";
import { fill, solutionOf, wrongOrEmpty } from "./cells.ts";
import { type PlayState, type Rec, isGame } from "./types.ts";

export const REVEAL_LINE = "🔎 Revealed a letter";

/** The player's random(), advanced once per reveal already made: the same game, the same cells. */
export function revealRandom(rec: Rec): () => number {
  const random = seedFor(rec.userId, isGame(rec) ? rec.date : String(rec.startedAt));

  for (let i = 0; i < rec.reveals; i++) random();

  return random;
}

/**
 * Writes the solution, uppercase, into one empty or wrong cell chosen by `random`; null when
 * every cell is already right.
 */
export function reveal(
  state: PlayState,
  random: () => number,
): { cells: string; reveals: number } | null {
  const { puzzle, cells, reveals } = state;
  const open = wrongOrEmpty(puzzle, cells);

  if (open.length === 0) return null;

  const cell = open[Math.floor(random() * open.length)]!;
  const next = fill(cells, [cell], solutionOf(puzzle)[cell]!.toUpperCase());

  return { cells: next, reveals: reveals + 1 };
}
