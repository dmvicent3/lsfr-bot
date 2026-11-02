import { type LeaderboardPage, leaderboardPage } from "../../../core/leaderboard-page.ts";
import type { DateRange } from "../../../core/types.ts";
import type { Standing } from "../types.ts";

const row = (s: Standing, rank: number): string =>
  `**${rank}.** <@${s.userId}> — ${s.points} pts · ${s.correct} correct`;

/** One page of the period's standings; the page is clamped to the ones there are. */
export function renderLeaderboard(v: {
  range: DateRange;
  list: Standing[];
  page: number;
  viewerId: string;
}): LeaderboardPage {
  return leaderboardPage({
    heading: `## 📊 Stat duel — ${v.range.label}`,
    empty: "No games finished yet. Play with `/duel play`.",
    list: v.list,
    page: v.page,
    viewerId: v.viewerId,
    row,
  });
}
