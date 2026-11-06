/** ★5: 0.6 % a pull, +6 points a pull from the 74th since the last ★5, certain on the 90th. */
export const FIVE = { base: 0.006, softFrom: 74, step: 0.06, hard: 90 } as const;
/** ★4: 5.1 % a pull, +51 points on the 9th since the last ★4, ★4-or-better on the 10th. */
export const FOUR = { base: 0.051, softFrom: 9, step: 0.51, hard: 10 } as const;
/** The chance a limited ★5 or ★4 is a featured driver when no guarantee is set. */
export const FEATURED_CHANCE = 0.5;

type Curve = { base: number; softFrom: number; step: number; hard: number };

/** The chance on the `n`th pull since the last hit (1-based). */
function chance(c: Curve, n: number): number {
  if (n >= c.hard) return 1;

  return Math.min(1, c.base + c.step * Math.max(0, n - c.softFrom + 1));
}

export const fiveChance = (n: number): number => chance(FIVE, n);

export const fourChance = (n: number): number => chance(FOUR, n);
