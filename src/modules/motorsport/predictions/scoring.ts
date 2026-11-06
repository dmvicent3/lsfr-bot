import type { PickScores, Score } from "./types.ts";
import type { ResultRow } from "../results/types.ts";

const EXACT = 5;
const ON_PODIUM = 2;
const PERFECT_BONUS = 5;

/** Per pick: 5 for the exact position, 2 for a podium driver in the wrong place; +5 for all three. */
export function pickScores(picks: readonly string[], rows: ResultRow[]): PickScores {
  const podium = ["1", "2", "3"].map((pos) => rows.find((r) => r.pos === pos)?.id ?? null);
  const each = picks.map((id, i) => {
    if (podium[i] === id) return EXACT;

    return podium.includes(id) ? ON_PODIUM : 0;
  });
  const perfect = each.filter((p) => p === EXACT).length === podium.length;

  return { each, bonus: perfect ? PERFECT_BONUS : 0 };
}

/** 5 per exact position, 2 for a podium driver in the wrong place, +5 for all three exact. */
export function scorePicks(picks: readonly string[], rows: ResultRow[]): Score {
  const { each, bonus } = pickScores(picks, rows);

  return { points: each.reduce((a, b) => a + b, 0) + bonus, perfect: bonus > 0 };
}
