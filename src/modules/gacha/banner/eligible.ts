import { choose } from "../engine/pick.ts";
import type { Featured } from "../engine/types.ts";

/** A banner stays out of the polls and the random picks for this many weeks after it ran. */
export const COOL_DOWN_WEEKS = 4;

/** The pool without the drivers featured on the `recent` banners; the whole pool if that leaves fewer than `need`. */
export function eligible(
  pool: readonly string[],
  recent: readonly Featured[],
  need: number,
): string[] {
  const used = new Set(recent.flatMap((f) => [f.five, ...f.fours]));
  const left = pool.filter((id) => !used.has(id));

  return left.length >= need ? left : [...pool];
}

/** `n` different items in random order (all of them when there are fewer). */
export function sample<T>(items: readonly T[], n: number, random: () => number): T[] {
  const left = [...items];
  const out: T[] = [];

  while (out.length < n && left.length > 0) {
    const item = choose(left, random);
    out.push(item);
    left.splice(left.indexOf(item), 1);
  }

  return out;
}
