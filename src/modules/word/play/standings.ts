import { periodRange } from "../periods.ts";
import { standings } from "../ranking.ts";
import type { WordRepo } from "../store/repo.ts";
import type { DateRange, Period, Standing, Track } from "../types.ts";

/** A period's range and its ordered standings for one track in one server. */
export function periodStandings(
  repo: WordRepo,
  track: Track,
  at: { guildId: string; period: Period; today: string },
): { range: DateRange; list: Standing[] } {
  const range = periodRange(at.period, at.today, track);

  return { range, list: standings(track.finishedIn(repo, at.guildId, range)) };
}
