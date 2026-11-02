import { shuffle } from "../../trivia/shuffle.ts";
import type { Grid } from "../types.ts";
import { candidates } from "./grid.ts";

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function place(g: Grid, cell: number, random: () => number): boolean {
  if (cell === g.length) return true;

  const mask = candidates(g, cell);

  for (const d of shuffle(DIGITS, random)) {
    if ((mask & (1 << (d - 1))) === 0) continue;

    g[cell] = d;

    if (place(g, cell + 1, random)) return true;
  }

  g[cell] = 0;

  return false;
}

/** A random complete valid grid, by backtracking with shuffled digits. */
export function fill(random: () => number): Grid {
  const g: Grid = Array(81).fill(0);

  place(g, 0, random);

  return g;
}
