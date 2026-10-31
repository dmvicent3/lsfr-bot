import { placementCounts } from "./density.ts";
import { colOf, rowOf } from "./grid.ts";
import type { Sight } from "./sight.ts";
import { targetCells } from "./target.ts";
import { type Difficulty, SIZE } from "./types.ts";

export const MAX_CANDIDATES = 6;

function shuffled(cells: number[], random: () => number): number[] {
  const out = [...cells];

  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j] ?? 0, out[i] ?? 0];
  }

  return out;
}

const sample = (cells: number[], random: () => number): number[] =>
  shuffled(cells, random).slice(0, MAX_CANDIDATES);

const unfired = (s: Sight): number[] =>
  Array.from({ length: SIZE * SIZE }, (_, i) => i).filter((i) => !s.fired.has(i));

/** The top cells by placement count, ties broken at random; count-0 cells only as a last resort. */
function ranked(cells: number[], counts: number[], random: () => number): number[] {
  const fit = cells.filter((c) => (counts[c] ?? 0) > 0);
  const pool = fit.length > 0 ? fit : cells;
  const order = shuffled(pool, random).toSorted((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0));

  return order.slice(0, MAX_CANDIDATES);
}

function hunt(s: Sight, level: Difficulty, random: () => number): number[] {
  const open = unfired(s);

  if (level === "hard") return ranked(open, placementCounts(s), random);

  if (level === "easy") return sample(open, random);

  const parity = open.filter((c) => (rowOf(c) + colOf(c)) % 2 === 0);

  return sample(parity.length > 0 ? parity : open, random);
}

/** The cells (at most 6) jevos may fire at this turn. */
export function candidates(s: Sight, level: Difficulty, random: () => number): number[] {
  if (level === "easy" || s.wounded.length === 0) return hunt(s, level, random);

  const cells = targetCells(s);

  if (cells.length === 0) return hunt(s, level, random);

  if (level === "normal") return sample(cells, random);

  return ranked(cells, placementCounts(s, s.wounded), random);
}
