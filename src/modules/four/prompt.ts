import type { JevQuestion } from "../../core/jev/types.ts";
import { other } from "./board.ts";
import { NAME, columnFacts } from "./facts.ts";
import { type Board, COLS, type Disc, ROWS } from "./types.ts";

function boardText(b: Board, me: Disc): string {
  const row = (r: number) =>
    Array.from({ length: COLS }, (_, c) => b[r * COLS + c] ?? ".").join(" ");

  return [
    `Four in a row board, 7 columns (1-7) by 6 rows, top row first; "." is empty, R is Red, Y is Yellow:`,
    ...Array.from({ length: ROWS }, (_, r) => row(r)),
    "1 2 3 4 5 6 7",
    `It is ${NAME[me]}'s turn. A disc drops to the lowest empty spot in its column. Four in a row (across, up or diagonal) wins.`,
  ].join("\n");
}

/** jevos's evidence: the board, then the facts for each candidate column. */
export function evidence(b: Board, me: Disc, cols: number[]): string {
  const facts = cols.map((c) => columnFacts(b, me, c));

  return `${boardText(b, me)}\n\nFacts per column:\n${facts.join("\n")}`;
}

/** One yes/no question per candidate, keyed by the column's number. */
export function questions(cols: number[], me: Disc): JevQuestion[] {
  const them = NAME[other(me)];

  return cols.map((c) => ({
    key: String(c + 1),
    instructions: `Should ${NAME[me]} drop in column ${c + 1}? Use the facts: winning now beats everything, then stopping ${them}'s win, then making two ways to win; never leave ${them} a win; prefer the centre.`,
  }));
}
