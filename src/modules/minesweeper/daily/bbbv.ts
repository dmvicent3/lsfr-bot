import { adjacentMines } from "../field.ts";
import { neighbours } from "../grid.ts";
import type { CellState } from "../types.ts";
import { zeroFlood } from "./flood.ts";

/**
 * 3BV: the fewest clicks that clear the board from `cells`. Each zero region still closed is one
 * click; each closed number that no zero touches is one more.
 */
export function bbbv(field: boolean[], cells: CellState[], width: number, height: number): number {
  const zero = (i: number): boolean => !field[i] && adjacentMines(field, i, width, height) === 0;
  const covered = new Set<number>();
  let clicks = 0;

  for (let i = 0; i < field.length; i++) {
    if (!zero(i) || covered.has(i)) continue;

    const region = zeroFlood(field, i, width, height);
    region.forEach((c) => covered.add(c));

    if (region.some((c) => cells[c] !== "open")) clicks++;
  }

  for (let i = 0; i < field.length; i++) {
    const lone = !field[i] && !zero(i) && !neighbours(i, width, height).some(zero);

    if (lone && cells[i] !== "open") clicks++;
  }

  return clicks;
}
