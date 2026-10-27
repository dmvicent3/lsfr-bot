import type { JevQuestion } from "../../core/jev/types.ts";
import { emptySquares, other } from "./board.ts";
import { squareFacts } from "./facts.ts";
import type { Board, Mark } from "./types.ts";

function boardText(board: Board, me: Mark): string {
  const row = (r: number) =>
    [0, 1, 2].map((c) => board[r * 3 + c] ?? String(r * 3 + c + 1)).join(" | ");
  const held = (mark: Mark) =>
    board.flatMap((cell, s) => (cell === mark ? [s + 1] : [])).join(", ") || "none";

  return [
    "Tic-tac-toe board (squares 1-9, left to right, top to bottom; a number means the square is empty):",
    row(0),
    row(1),
    row(2),
    `X has squares: ${held("X")}. O has squares: ${held("O")}.`,
    `It is ${me}'s turn. Three in a row (row, column or diagonal) wins.`,
  ].join("\n");
}

/** jevos's evidence: the board, then the facts for every empty square (probe wording, keep it). */
export function evidence(board: Board, me: Mark): string {
  const facts = emptySquares(board).map((s) => squareFacts(board, me, s));

  return `${boardText(board, me)}\n\nFacts per empty square:\n${facts.join("\n")}`;
}

/** One yes/no question per empty square, keyed by the square's number. */
export function questions(board: Board, me: Mark): JevQuestion[] {
  const them = other(me);

  return emptySquares(board).map((s) => ({
    key: String(s + 1),
    instructions: `Should ${me} take square ${s + 1}? Use the facts: winning now beats everything, then stopping ${them}'s win, then making two ways to win; never leave ${them} a win.`,
  }));
}
