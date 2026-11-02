import { statsHandler } from "../../../core/stats-command.ts";
import { periodRange } from "../periods.ts";
import { standings } from "../ranking.ts";
import { renderStats } from "../render/stats.ts";
import { sudokuTimeZone } from "../settings.ts";
import { playerStats } from "../stats.ts";
import type { SudokuRepo } from "../store/repo.ts";

/** Private: the asker's stats, or another member's. */
export const stats = statsHandler({
  timeZone: sudokuTimeZone,
  periodRange,
  finishedIn: (repo: SudokuRepo, guildId, range) => repo.games.solvedIn(guildId, range),
  finishedBy: (repo: SudokuRepo, guildId, userId) => repo.games.solvedBy(guildId, userId),
  standings,
  playerStats,
  renderStats,
});
