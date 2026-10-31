import type { Sight } from "../../../src/modules/fleet/sight.ts";

/** A sight from its parts; `fired` is every miss, sunk and wounded cell. Default: full fleet. */
export function sight(p: Partial<Omit<Sight, "fired">>): Sight {
  const misses = p.misses ?? [];
  const sunk = p.sunk ?? [];
  const wounded = p.wounded ?? [];

  return {
    fired: new Set([...misses, ...sunk, ...wounded]),
    misses,
    sunk,
    wounded,
    afloat: p.afloat ?? [5, 4, 3, 3, 2],
  };
}

/** Every cell index 0–99 except `keep`. */
export const allBut = (keep: number[]): number[] =>
  Array.from({ length: 100 }, (_, i) => i).filter((i) => !keep.includes(i));
