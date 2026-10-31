import { emptySquares } from "./board.ts";
import { forcedSquares } from "./forced.ts";
import { losingSquares } from "./search.ts";
import type { Board, Candidates, Difficulty, Mark } from "./types.ts";

/**
 * The squares jevos may choose from at `level`: easy all of them, normal the forced win or block
 * when there is one, hard also without any square that loses to perfect play (jevos cannot lose).
 */
export function candidates(board: Board, me: Mark, level: Difficulty): Candidates {
  const free = emptySquares(board);

  if (level === "easy") return { squares: free, forced: false };

  const forced = forcedSquares(board, me);

  if (forced.length > 0) return { squares: forced, forced: true };

  if (level === "normal") return { squares: free, forced: false };

  const lost = losingSquares(board, me);
  const safe = free.filter((s) => !lost.includes(s));

  return { squares: safe.length > 0 ? safe : free, forced: false };
}
