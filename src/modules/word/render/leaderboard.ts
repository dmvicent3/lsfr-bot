import { leaderboardPage } from "../../../core/leaderboard-page.ts";
import type { DateRange, LeaderboardPage, Period, Standing, Track } from "../types.ts";

export { PAGE_SIZE } from "../../../core/leaderboard-page.ts";

const pct = (s: Standing): number => Math.round((s.wins / s.games) * 100);

const row = (s: Standing, rank: number): string =>
  `**${rank}.** <@${s.userId}> — ${s.points} pts · ${s.wins} W · ${pct(s)}%`;

/** One page of the period's standings; the page is clamped to the ones there are. */
export function renderLeaderboard(v: {
  track: Pick<Track, "name" | "play">;
  period: Period;
  range: DateRange;
  list: Standing[];
  page: number;
  viewerId: string;
}): LeaderboardPage {
  return leaderboardPage({
    heading: `## 🟩 ${v.track.name} — ${v.range.label}`,
    empty: `No games yet. Play with \`${v.track.play}\`.`,
    list: v.list,
    page: v.page,
    viewerId: v.viewerId,
    row,
  });
}
