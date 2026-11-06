import { adjacentMines } from "../field.ts";
import { neighbours } from "../grid.ts";

/** What revealing `start` opens on a fresh board: the zeros it reaches and their numbered border. */
export function zeroFlood(
  field: boolean[],
  start: number,
  width: number,
  height: number,
): number[] {
  const seen = new Set([start]);
  const queue = [start];

  for (let c = queue.shift(); c !== undefined; c = queue.shift()) {
    if (adjacentMines(field, c, width, height) !== 0) continue;

    for (const n of neighbours(c, width, height)) {
      if (!seen.has(n) && !field[n]) {
        seen.add(n);
        queue.push(n);
      }
    }
  }

  return [...seen].toSorted((a, b) => a - b);
}
