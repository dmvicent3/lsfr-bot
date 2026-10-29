import { neighbours } from "./grid.ts";
import type { Setup } from "./types.ts";

/** Mines laid uniformly outside `safeCenter` and its neighbours, so the first reveal is safe. */
export function layMines(setup: Setup, safeCenter: number, random: () => number): boolean[] {
  const cells = setup.width * setup.height;
  const zone = new Set([safeCenter, ...neighbours(safeCenter, setup.width, setup.height)]);
  const candidates = Array.from({ length: cells }, (_, i) => i).filter((i) => !zone.has(i));
  const field = Array.from({ length: cells }, () => false);

  for (let k = 0; k < setup.mines && k < candidates.length; k++) {
    const pick = k + Math.floor(random() * (candidates.length - k));
    [candidates[k], candidates[pick]] = [candidates[pick] ?? 0, candidates[k] ?? 0];
    field[candidates[k] ?? 0] = true;
  }

  return field;
}

export function adjacentMines(field: boolean[], i: number, width: number, height: number): number {
  return neighbours(i, width, height).filter((n) => field[n]).length;
}
