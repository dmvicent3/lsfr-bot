import { UNITS } from "../grid.ts";
import { eliminate, popcount } from "./board.ts";
import type { Board, Technique } from "./types.ts";

function clearPair(b: Board, unit: readonly number[], pair: number[]): boolean {
  const mask = b.marks[pair[0]!]!;
  let changed = false;

  for (const c of unit) {
    if (!pair.includes(c) && eliminate(b, c, mask)) changed = true;
  }

  return changed;
}

function pairsIn(b: Board, unit: readonly number[]): number[][] {
  const twos = unit.filter((c) => popcount(b.marks[c]!) === 2);
  const found: number[][] = [];

  twos.forEach((a, i) => {
    for (const o of twos.slice(i + 1)) if (b.marks[a] === b.marks[o]) found.push([a, o]);
  });

  return found;
}

/** Two cells of a unit sharing the same two candidates: nobody else there can hold them. */
export const nakedPair: Technique = (b: Board) => {
  for (const unit of UNITS) {
    for (const pair of pairsIn(b, unit)) if (clearPair(b, unit, pair)) return true;
  }

  return false;
};
