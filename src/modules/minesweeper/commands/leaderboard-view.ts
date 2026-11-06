import { leaderboardView as view } from "../../../core/leaderboard-view.ts";
import { periodRange } from "../daily/periods.ts";
import { standings } from "../daily/ranking.ts";
import type { Standing } from "../daily/types.ts";
import { renderLeaderboard as render } from "../render/leaderboard.ts";
import { minesweeperTimeZone } from "../settings.ts";
import type { GameStore } from "../store/games.ts";
import type { Game } from "../types.ts";

/** A leaderboard page as of `now`; the slash command and the page buttons both send this. */
export const leaderboardView = view<GameStore, Game, Standing>({
  prefix: "minesweeper:page",
  timeZone: minesweeperTimeZone,
  periodRange,
  games: (store, guildId, range) => store.dailies.inRange(guildId, range),
  standings,
  render,
});
