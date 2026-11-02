import { candidates, PEERS } from "../grid.ts";
import type { Grid } from "../../types.ts";
import type { Board } from "./types.ts";

export const bitOf = (d: number): number => 1 << (d - 1);

export const digitOf = (mask: number): number => 31 - Math.clz32(mask) + 1;

export function popcount(mask: number): number {
  let n = 0;

  for (let m = mask; m !== 0; m &= m - 1) n++;

  return n;
}

export function makeBoard(givens: Grid): Board {
  const cells = [...givens];
  const marks = cells.map((d, c) => (d === 0 ? candidates(cells, c) : 0));

  return { cells, marks };
}

/** Puts a digit in a cell and removes it from the marks of its peers. */
export function place(b: Board, cell: number, digit: number): void {
  b.cells[cell] = digit;
  b.marks[cell] = 0;

  for (const p of PEERS[cell]!) b.marks[p]! &= ~bitOf(digit);
}

/** Removes the digits in `mask` from a cell's marks; true when something changed. */
export function eliminate(b: Board, cell: number, mask: number): boolean {
  const before = b.marks[cell]!;
  b.marks[cell] = before & ~mask;

  return b.marks[cell] !== before;
}
