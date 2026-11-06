import { earnedBy } from "../../../core/points.ts";
import type { PlayerRef, PointsSource } from "../../../core/points-types.ts";
import { sum } from "../../../core/sum.ts";
import type { Ledger } from "../engine/types.ts";
import { gachaPrice } from "../settings.ts";
import type { GachaRepo } from "../store/repo.ts";
import { inCurrency } from "./currency.ts";

type Sources = { repo: GachaRepo; sources: readonly PointsSource[] };

/** What each game gave the player, as currency at the server's pull price. */
export const earnedGames = (v: Sources, who: PlayerRef) =>
  inCurrency(earnedBy(v.sources, v.repo.db, who), gachaPrice(v.repo.db, who.guildId));

/** A player's earned currency (every game, all time), refunds and spend. */
export function ledgerOf(v: Sources, who: PlayerRef): Ledger {
  const earned = sum(earnedGames(v, who).map((g) => g.points));

  return { earned, ...v.repo.pulls.ledger(who) };
}
