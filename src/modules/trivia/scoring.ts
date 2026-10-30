import type { Difficulty } from "./types.ts";

export const BASE: Record<Difficulty, number> = { easy: 10, medium: 15, hard: 20 };

export const KAOS_POINTS = 10;

const BUTTON_MS = 20_000;

const TYPED_SHARE: Record<0 | 1 | 2, number> = { 0: 1, 1: 1 / 2, 2: 1 / 4 };

/** Full before hint 2, half from hint 2, a quarter from hint 3, rounded up. */
export const typedPoints = (d: Difficulty, level: 0 | 1 | 2): number =>
  Math.ceil(BASE[d] * TYPED_SHARE[level]);

/** The base at once, falling to half at 20 s. */
export function buttonPoints(d: Difficulty, ms: number): number {
  const share = Math.min(Math.max(ms, 0), BUTTON_MS) / BUTTON_MS;

  return Math.round(BASE[d] * (1 - 0.5 * share));
}
