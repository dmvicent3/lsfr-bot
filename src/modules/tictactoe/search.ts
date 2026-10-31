import { emptySquares, other, place, winner } from "./board.ts";
import type { Board, Mark } from "./types.ts";

/** A board's value for `me` to move under perfect play: 1 a win, 0 a draw, -1 a loss. */
function value(board: Board, me: Mark, memo: Map<string, number>): number {
  const key = `${me}${board.map((c) => c ?? "-").join("")}`;
  const known = memo.get(key);

  if (known !== undefined) return known;

  let best = emptySquares(board).length > 0 ? -1 : 0;

  for (const s of emptySquares(board)) {
    const next = place(board, s, me);
    const v = winner(next) === me ? 1 : -value(next, other(me), memo);
    best = Math.max(best, v);

    if (best === 1) break;
  }

  memo.set(key, best);

  return best;
}

/** What taking `square` is worth to `me` under perfect play from then on. */
function squareValue(board: Board, me: Mark, square: number, memo: Map<string, number>): number {
  const next = place(board, square, me);

  return winner(next) === me ? 1 : -value(next, other(me), memo);
}

/** Empty squares after which `me` loses against perfect play; the tree is small enough to search. */
export function losingSquares(board: Board, me: Mark): number[] {
  const memo = new Map<string, number>();

  return emptySquares(board).filter((s) => squareValue(board, me, s, memo) === -1);
}
