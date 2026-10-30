import { other, winsFor } from "./board.ts";
import type { Board, Mark } from "./types.ts";

/**
 * The squares `me` has to take: its wins, else the squares that stop the other side's win;
 * empty when nothing is forced. jevos misses about one block in five, so code plays these and
 * jevos only judges open positions (forks stay its call, which keeps it beatable).
 */
export function forcedSquares(board: Board, me: Mark): number[] {
  const wins = winsFor(board, me);

  return wins.length > 0 ? wins : winsFor(board, other(me));
}
