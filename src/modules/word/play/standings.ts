import { periodRange } from "../periods.ts";
import { standings } from "../ranking.ts";
import type { WordRepo } from "../store/repo.ts";
import type { DateRange, Period, Standing } from "../types.ts";

/** A period's range and its ordered standings in one server. */
export function periodStandings(
  repo: WordRepo,
  guildId: string,
  period: Period,
  today: string,
): { range: DateRange; list: Standing[] } {
  const range = periodRange(period, today);

  return { range, list: standings(repo.games.finishedIn(guildId, range)) };
}
