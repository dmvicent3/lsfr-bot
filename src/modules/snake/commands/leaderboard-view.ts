import { leaderboardView as view } from "../../../core/leaderboard-view.ts";
import { periodRange } from "../periods.ts";
import { standings } from "../ranking.ts";
import type { Standing } from "../ranking-types.ts";
import { renderLeaderboard as render } from "../render/leaderboard.ts";
import { snakeTimeZone } from "../settings.ts";
import type { SnakeRepo } from "../store/repo.ts";
import type { Game } from "../types.ts";

/** A leaderboard page as of `now`; the slash command and the page buttons both send this. */
export const leaderboardView = view<SnakeRepo, Game, Standing>({
  prefix: "snake:page",
  timeZone: snakeTimeZone,
  periodRange,
  games: (repo, guildId, range) => repo.games.finishedIn(guildId, range),
  standings,
  render,
});
