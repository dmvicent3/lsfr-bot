import { colOf, neighbours, rowOf } from "./grid.ts";
import type { Sight } from "./sight.ts";
import { SIZE } from "./types.ts";

/** One step from `c` along an axis, or null off the grid (across stays in its row). */
function step(c: number, axis: "across" | "down", by: 1 | -1): number | null {
  if (axis === "across") {
    const col = colOf(c) + by;

    return col >= 0 && col < SIZE ? c + by : null;
  }

  const row = rowOf(c) + by;

  return row >= 0 && row < SIZE ? c + by * SIZE : null;
}

/** The first non-wounded cell walking from `c` along an axis, or null off the grid. */
function walk(c: number, axis: "across" | "down", by: 1 | -1, wounded: Set<number>): number | null {
  let at = step(c, axis, by);

  while (at !== null && wounded.has(at)) at = step(at, axis, by);

  return at;
}

/** The open ends of every line of two or more wounded cells; null when no hits line up. */
function lineEnds(s: Sight): number[] | null {
  const wounded = new Set(s.wounded);
  const ends = new Set<number>();
  let lined = false;

  for (const c of s.wounded) {
    for (const axis of ["across", "down"] as const) {
      const next = step(c, axis, 1);

      if (next === null || !wounded.has(next)) continue;

      lined = true;
      const open = [walk(c, axis, -1, wounded), walk(c, axis, 1, wounded)].filter(
        (e): e is number => e !== null && !s.fired.has(e),
      );
      open.forEach((e) => ends.add(e));
    }
  }

  return lined ? [...ends] : null;
}

/** Normal and hard targeting: a line's open ends, else every unfired neighbour of a hit. */
export function targetCells(s: Sight): number[] {
  const ends = lineEnds(s);

  if (ends && ends.length > 0) return ends;

  const around = new Set(s.wounded.flatMap(neighbours).filter((c) => !s.fired.has(c)));

  return [...around];
}
