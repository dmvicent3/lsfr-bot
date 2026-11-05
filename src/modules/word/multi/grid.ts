import { feedback } from "../feedback.ts";
import { squares } from "../render/board.ts";
import type { BoardState } from "./types.ts";

/**
 * Boards shown side by side. Quad is always two blocks of two (2×2): a line then holds as many
 * squares as a Duo line, and four across (16 to 28 squares plus the word) is wider than a phone at
 * every length, so a switch on the length would never pick it.
 */
const PER_BLOCK = 2;

/** The boards in blocks of two: Duo is one block, Quad two. */
export const blocks = <T>(items: readonly T[]): T[][] =>
  Array.from({ length: Math.ceil(items.length / PER_BLOCK) }, (_, n) =>
    items.slice(n * PER_BLOCK, (n + 1) * PER_BLOCK),
  );

/** Cells with a divider between; an empty last cell is dropped, an empty first keeps the divider. */
export function joinCells(cells: readonly string[]): string {
  const kept = [...cells];

  while (kept.length > 0 && kept.at(-1) === "") kept.pop();

  return kept.join(" │ ").trim();
}

/** Guess `k`'s squares on a board, or nothing once the board was solved by an earlier guess. */
const cell = (b: BoardState, guess: string, k: number): string =>
  b.solvedAt !== null && k >= b.solvedAt ? "" : squares(feedback(guess, b.word));

/** One block's rows: each guess once, then its squares on each board; `label` names the guess. */
export function gridRows(
  boards: readonly BoardState[],
  guesses: readonly string[],
  label?: (guess: string) => string,
): string[] {
  return guesses.flatMap((g, k) => {
    const cells = boards.map((b) => cell(b, g, k));

    if (cells.every((c) => c === "")) return [];

    const row = joinCells(cells);

    return [label ? `${label(g)} ${row}` : row];
  });
}
