import { coinsOf, fiftyFifty } from "../engine/streaks.ts";
import type { Landed } from "../engine/types.ts";

/**
 * The run each new limited ★5 50/50 is on as it lands (2 = the second won, or lost, in a row).
 * `history` is every limited ★5's featured flag, oldest first, already holding the new ones;
 * guaranteed ★5s rolled no 50/50 and get no entry.
 */
export function newFiveRuns(
  history: readonly boolean[],
  landed: readonly Landed[],
): Map<Landed, number> {
  const fives = landed.filter((l) => l.tier === 5);
  const before = history.length - fives.length;
  const runs = new Map<Landed, number>();

  fives.forEach((l, k) => {
    const run = fiftyFifty(coinsOf(history.slice(0, before + k + 1))).current?.run;

    if (!l.guaranteed && run !== undefined) runs.set(l, run);
  });

  return runs;
}
