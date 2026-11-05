import { leaderboardView as view } from "../../../core/leaderboard-view.ts";
import { periodRange } from "../periods.ts";
import { standings } from "../ranking.ts";
import type { Standing } from "../ranking-types.ts";
import { renderLeaderboard as render } from "../render/leaderboard.ts";
import { groupsTimeZone } from "../settings.ts";
import type { GroupsRepo } from "../store/repo.ts";
import type { Game } from "../types.ts";

/** A leaderboard page as of `now`; the slash command and the page buttons both send this. */
export const leaderboardView = view<GroupsRepo, Game, Standing>({
  prefix: "groups:page",
  timeZone: groupsTimeZone,
  periodRange,
  games: (repo, guildId, range) => repo.games.finishedIn(guildId, range),
  standings,
  render,
});
