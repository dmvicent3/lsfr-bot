import { monthRange, rangeInstants, weekRange } from "../../../core/periods.ts";
import type { DateRange } from "../../../core/types.ts";
import { dateIn } from "../../../core/zoned.ts";
import { rankAndGap } from "../render/results.ts";
import type { TriviaRepo } from "../store/repo.ts";
import type { Standing } from "../store/types.ts";
import { TRIVIA_TZ } from "../zone.ts";

const pointsOf = (list: Standing[], userId: string): number =>
  list.find((s) => s.userId === userId)?.points ?? 0;

/** A player's month rank and gap to the leader, and their today/week/month points. */
export function standingOf(repo: TriviaRepo, guildId: string, userId: string, now: number) {
  const today = dateIn(now, TRIVIA_TZ);

  const board = (range: DateRange): Standing[] => {
    const { from, to } = rangeInstants(range, TRIVIA_TZ);

    return repo.scores.standings(guildId, from, to);
  };

  const month = board(monthRange(today));
  const totals = {
    today: pointsOf(board({ from: today, to: today, label: "" }), userId),
    week: pointsOf(board(weekRange(today)), userId),
    month: pointsOf(month, userId),
  };

  return { ...rankAndGap(month, userId), totals };
}
