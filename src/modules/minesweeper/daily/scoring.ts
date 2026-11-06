import { streakBonus } from "../../../core/daily.ts";
import type { Preset } from "../types.ts";
import type { Award } from "./types.ts";

export const BASE: Record<Preset, number> = { beginner: 50, intermediate: 100, expert: 150 };

/** Points lost per click over the board's 3BV. */
export const PER_EXTRA_CLICK = 1;

const label = (level: Preset): string => level[0]!.toUpperCase() + level.slice(1);

/** A won daily: the level's base less the extra clicks (never below half), plus the streak. */
export function award(level: Preset, clicks: number, bbbv: number, streak: number): Award {
  const base = BASE[level];
  const extra = Math.max(0, clicks - bbbv);
  const penalty = Math.min(PER_EXTRA_CLICK * extra, base / 2);
  const bonus = streakBonus(streak);
  const parts = [`${label(level)}: ${base}`];

  if (penalty > 0) parts.push(`${extra} extra click${extra === 1 ? "" : "s"}: −${penalty}`);

  if (bonus > 0) parts.push(`Streak ${streak}: +${bonus}`);

  return { points: base - penalty + bonus, parts };
}
