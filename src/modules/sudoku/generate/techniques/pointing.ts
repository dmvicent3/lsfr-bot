import { UNITS } from "../grid.ts";
import { bitOf, eliminate } from "./board.ts";
import type { Board, Technique } from "./types.ts";

const BOXES = UNITS.slice(18);
const rowOf = (c: number) => Math.floor(c / 9);
const colOf = (c: number) => c % 9;

function sameLine(spots: number[], line: (c: number) => number): boolean {
  return spots.every((c) => line(c) === line(spots[0]!));
}

function clearLine(b: Board, spots: number[], line: (c: number) => number, d: number): boolean {
  let changed = false;

  for (let c = 0; c < 81; c++) {
    const outside = line(c) === line(spots[0]!) && !spots.includes(c);

    if (outside && eliminate(b, c, bitOf(d))) changed = true;
  }

  return changed;
}

function pointAt(b: Board, spots: number[], d: number): boolean {
  if (spots.length < 2) return false;

  if (sameLine(spots, rowOf)) return clearLine(b, spots, rowOf, d);

  return sameLine(spots, colOf) && clearLine(b, spots, colOf, d);
}

/** A digit confined to one row or column of a box leaves that line's other cells. */
export const pointing: Technique = (b: Board) => {
  for (const box of BOXES) {
    for (let d = 1; d <= 9; d++) {
      const spots = box.filter((c) => (b.marks[c]! & bitOf(d)) !== 0);

      if (pointAt(b, spots, d)) return true;
    }
  }

  return false;
};
