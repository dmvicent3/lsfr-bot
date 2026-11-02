import { type LeaderboardPage, leaderboardPage } from "../../../core/leaderboard-page.ts";
import type { DateRange } from "../../../core/types.ts";
import type { Period, Standing } from "../types.ts";

const row = (s: Standing, rank: number): string =>
  `**${rank}.** <@${s.userId}> — ${s.points} pts · ${s.solved} solved`;

/** One page of the period's standings; the page is clamped to the ones there are. */
export function renderLeaderboard(v: {
  period: Period;
  range: DateRange;
  list: Standing[];
  page: number;
  viewerId: string;
}): LeaderboardPage {
  return leaderboardPage({
    heading: `## 🔢 Sudoku — ${v.range.label}`,
    empty: "No puzzles solved yet. Play with `/sudoku daily`.",
    list: v.list,
    page: v.page,
    viewerId: v.viewerId,
    row,
  });
}
