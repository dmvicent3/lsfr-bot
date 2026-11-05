import { plural, winBonus } from "../scoring.ts";
import type { Award } from "../types.ts";

export const PER_WORD = 50;

/**
 * Points for a finished multi game: 50 per word found, win or not; a full solve adds the unused
 * attempts and the streak bonus the way a classic win does.
 */
export function multiAward(g: {
  found: number;
  won: boolean;
  unused: number;
  streak: number;
}): Award {
  const base = PER_WORD * g.found;
  const parts = g.found > 0 ? [`${base} for ${plural(g.found, "word")}`] : ["no words found"];

  if (!g.won) return { points: base, parts };

  const extra = winBonus(g.unused, g.streak);

  return { points: base + extra.points, parts: [...parts, ...extra.parts] };
}
