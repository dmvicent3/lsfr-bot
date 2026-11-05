import { statsHandler } from "../../../core/stats-command.ts";
import { periodRange } from "../periods.ts";
import { standings } from "../ranking.ts";
import { renderStats } from "../render/stats.ts";
import { snakeTimeZone } from "../settings.ts";
import { playerStats } from "../stats.ts";
import type { SnakeRepo } from "../store/repo.ts";

/** Private: the asker's stats, or another member's. */
export const stats = statsHandler({
  timeZone: snakeTimeZone,
  periodRange,
  finishedIn: (repo: SnakeRepo, guildId, range) => repo.games.finishedIn(guildId, range),
  finishedBy: (repo: SnakeRepo, guildId, userId) => repo.games.finishedBy(guildId, userId),
  standings,
  playerStats,
  renderStats,
});
