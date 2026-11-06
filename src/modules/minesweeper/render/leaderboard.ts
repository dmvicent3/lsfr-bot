import { type LeaderboardPage, leaderboardPage } from "../../../core/leaderboard-page.ts";
import type { DateRange } from "../../../core/types.ts";
import type { Standing } from "../daily/types.ts";

const row = (s: Standing, rank: number): string =>
  `**${rank}.** <@${s.userId}> — ${s.points} pts · ${s.wins} won`;

/** One page of the period's standings; the page is clamped to the ones there are. */
export function renderLeaderboard(v: {
  range: DateRange;
  list: Standing[];
  page: number;
  viewerId: string;
}): LeaderboardPage {
  return leaderboardPage({
    heading: `## 💣 Minesweeper — ${v.range.label}`,
    empty: "No dailies finished yet. Play with `/minesweeper daily`.",
    list: v.list,
    page: v.page,
    viewerId: v.viewerId,
    row,
  });
}
