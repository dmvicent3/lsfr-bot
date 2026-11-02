import { leaderboardView as view } from "../../../core/leaderboard-view.ts";
import { periodRange } from "../periods.ts";
import { standings } from "../ranking.ts";
import { renderLeaderboard as render } from "../render/leaderboard.ts";
import { sudokuTimeZone } from "../settings.ts";
import type { SudokuRepo } from "../store/repo.ts";
import type { Game, Standing } from "../types.ts";

/** A leaderboard page as of `now`; the slash command and the page buttons both send this. */
export const leaderboardView = view<SudokuRepo, Game, Standing>({
  prefix: "sudoku:page",
  timeZone: sudokuTimeZone,
  periodRange,
  games: (repo, guildId, range) => repo.games.solvedIn(guildId, range),
  standings,
  render,
});
