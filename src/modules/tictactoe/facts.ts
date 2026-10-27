import { SQUARE_NAMES, emptySquares, other, place, squareKind, winsFor } from "./board.ts";
import type { Board, Mark } from "./types.ts";

const yn = (b: boolean): string => (b ? "yes" : "no");

/** Whether `mark`, moving next on `board`, can open two ways to win at once. */
const canFork = (board: Board, mark: Mark): boolean =>
  emptySquares(board).some((s) => winsFor(place(board, s, mark), mark).length >= 2);

/**
 * What taking `square` does, worked out here so jevos only weighs it (it cannot read a board).
 * The wording is the one probed against live jevos on 2026-10-27; keep it.
 */
export function squareFacts(board: Board, me: Mark, square: number): string {
  const them = other(me);
  const winsNow = winsFor(board, me).includes(square);
  const after = place(board, square, me);

  return [
    `Square ${square + 1} (${SQUARE_NAMES[square]}, a ${squareKind(square)})`,
    `- Taking it gives ${me} three in a row now: ${yn(winsNow)}`,
    `- Taking it stops ${them}'s three in a row next turn: ${yn(winsFor(board, them).includes(square))}`,
    `- Taking it gives ${me} two ways to win next turn: ${yn(winsFor(after, me).length >= 2)}`,
    `- After it, ${them} can win on their next move: ${yn(!winsNow && winsFor(after, them).length > 0)}`,
    `- After it, ${them} can make two ways to win: ${yn(!winsNow && canFork(after, them))}`,
  ].join("\n");
}
