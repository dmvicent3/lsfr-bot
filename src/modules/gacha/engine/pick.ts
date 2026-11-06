import { FEATURED_CHANCE } from "./rates.ts";
import type { Pick } from "./types.ts";

/** A uniform choice; `items` must not be empty. */
export function choose<T>(items: readonly T[], random: () => number): T {
  const item = items[Math.floor(random() * items.length)];

  if (item === undefined) throw new Error("choose: empty list");

  return item;
}

/** Any driver of the pool, as the standard banner and every ★3 do. */
export const pickAny = (pool: readonly string[], random: () => number): Pick => ({
  driverId: choose(pool, random),
  featured: false,
  lost: false,
  guarantee: false,
});

/**
 * A limited ★5 or ★4: a featured driver with the guarantee or a won 50/50; otherwise one of the
 * others, and the guarantee is set.
 */
export function pickFeatured(
  v: { pool: readonly string[]; featured: readonly string[]; guarantee: boolean },
  random: () => number,
): Pick {
  if (v.guarantee || random() < FEATURED_CHANCE) {
    return { driverId: choose(v.featured, random), featured: true, lost: false, guarantee: false };
  }

  const others = v.pool.filter((id) => !v.featured.includes(id));

  return { driverId: choose(others, random), featured: false, lost: true, guarantee: true };
}
