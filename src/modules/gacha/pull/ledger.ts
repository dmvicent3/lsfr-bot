import { earnedBy } from "../../../core/points.ts";
import type { PlayerRef, PointsSource } from "../../../core/points-types.ts";
import { sum } from "../../../core/sum.ts";
import type { Ledger } from "../engine/types.ts";
import type { GachaRepo } from "../store/repo.ts";

/** A player's earned points (every game, all time), refunds and spend. */
export function ledgerOf(
  v: { repo: GachaRepo; sources: readonly PointsSource[] },
  who: PlayerRef,
): Ledger {
  const earned = sum(earnedBy(v.sources, v.repo.db, who).map((g) => g.points));

  return { earned, ...v.repo.pulls.ledger(who) };
}
