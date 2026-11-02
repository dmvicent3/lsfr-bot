import type { Grid } from "../types.ts";
import { candidates, PEERS } from "./grid.ts";

function bitCount(n: number): number {
  let count = 0;

  for (let m = n; m !== 0; m &= m - 1) count++;

  return count;
}

function hasConflict(g: Grid): boolean {
  return g.some((d, c) => d !== 0 && PEERS[c]!.some((p) => g[p] === d));
}

/** The empty cell with the fewest candidates, or -1 when the grid is full. */
function tightestCell(g: Grid): number {
  let best = -1;
  let bestCount = 10;

  for (let c = 0; c < g.length; c++) {
    if (g[c] !== 0) continue;

    const n = bitCount(candidates(g, c));

    if (n < bestCount) {
      best = c;
      bestCount = n;
    }
  }

  return best;
}

function search(g: Grid, limit: number): number {
  const cell = tightestCell(g);

  if (cell === -1) return 1;

  let found = 0;
  const mask = candidates(g, cell);

  for (let d = 1; d <= 9 && found < limit; d++) {
    if ((mask & (1 << (d - 1))) === 0) continue;

    g[cell] = d;
    found += search(g, limit - found);
  }

  g[cell] = 0;

  return found;
}

/** Counts solutions, stopping at `limit`; 0 for a grid with a conflict. */
export function countSolutions(g: Grid, limit: number): number {
  if (hasConflict(g)) return 0;

  return search([...g], limit);
}
