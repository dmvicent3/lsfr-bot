import type { Snapshot } from "../../core/countries/types.ts";
import { streakBonus } from "../../core/daily.ts";
import type { Award } from "./types.ts";

export const PER_PERFECT = 30;
export const CELLS = 9;

/** Population rank scaled 0 (most populous) to 1 (least); no reading counts as 1. */
export function obscurity(snapshot: Snapshot): Map<string, number> {
  const read = snapshot.countries
    .flatMap((c) => {
      const pop = c.values.population?.value;

      return pop === undefined ? [] : [{ iso2: c.iso2, pop }];
    })
    .toSorted((a, b) => b.pop - a.pop);
  const last = Math.max(read.length - 1, 1);
  const ranked = new Map(read.map((r, i) => [r.iso2, i / last]));

  return new Map(snapshot.countries.map((c) => [c.iso2, ranked.get(c.iso2) ?? 1]));
}

export const cellPoints = (_iso2: string, o: number): number => 10 + Math.round(20 * o);

/** `cellsTotal`: the cell points earned; `streak`: the streak after this game. */
export function award(cellsTotal: number, filled: number, streak: number): Award {
  const perfect = filled === CELLS ? PER_PERFECT : 0;
  const bonus = streakBonus(streak);
  const parts = [`${filled} cells: ${cellsTotal}`];

  if (perfect > 0) parts.push(`Perfect: +${perfect}`);

  if (bonus > 0) parts.push(`Streak ${streak}: +${bonus}`);

  return { points: cellsTotal + perfect + bonus, parts };
}
