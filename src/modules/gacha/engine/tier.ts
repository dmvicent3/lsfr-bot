import { fiveChance, fourChance } from "./rates.ts";
import type { Pity, Tier } from "./types.ts";

/** The tier a pull lands on for `r` in [0, 1): ★5 below the ★5 chance, ★4 below both chances added. */
export function rollTier(pity: Pick<Pity, "five" | "four">, r: number): Tier {
  const five = fiveChance(pity.five + 1);

  if (r < five) return 5;

  return r < five + fourChance(pity.four + 1) ? 4 : 3;
}

/** The counters after a pull: each tier resets only its own counter; the other keeps counting. */
export function countAfter(pity: Pity, tier: Tier): Pity {
  return {
    ...pity,
    five: tier === 5 ? 0 : pity.five + 1,
    four: tier === 4 ? 0 : pity.four + 1,
  };
}
