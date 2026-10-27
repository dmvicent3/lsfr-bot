import type { Board, Mark } from "./types.ts";

/** Rows, then columns, then diagonals. */
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

const CORNERS = new Set([0, 2, 6, 8]);

export const SQUARE_NAMES = [
  "top-left",
  "top-middle",
  "top-right",
  "middle-left",
  "centre",
  "middle-right",
  "bottom-left",
  "bottom-middle",
  "bottom-right",
] as const;

export const emptyBoard = (): Board => Array<null>(9).fill(null);

export function place(board: Board, square: number, mark: Mark): Board {
  const next = [...board];
  next[square] = mark;

  return next;
}

export const emptySquares = (board: Board): number[] =>
  board.flatMap((cell, square) => (cell ? [] : [square]));

export function winningLine(board: Board): number[] | null {
  const line = LINES.find(
    ([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c],
  );

  return line ? [...line] : null;
}

export function winner(board: Board): Mark | null {
  const line = winningLine(board);

  return line ? (board[line[0]!] ?? null) : null;
}

export const other = (mark: Mark): Mark => (mark === "X" ? "O" : "X");

/** X moves first, so it is X's turn whenever both have played as often. */
export function turnOf(board: Board): Mark {
  const xs = board.filter((c) => c === "X").length;
  const os = board.filter((c) => c === "O").length;

  return xs === os ? "X" : "O";
}

/** The empty squares that would complete three in a row for `mark`. */
export const winsFor = (board: Board, mark: Mark): number[] =>
  emptySquares(board).filter((square) => winner(place(board, square, mark)) === mark);

export function squareKind(square: number): "centre" | "corner" | "edge" {
  if (square === 4) return "centre";

  return CORNERS.has(square) ? "corner" : "edge";
}
