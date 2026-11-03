import { statsHandler } from "../../../core/stats-command.ts";
import { periodRange } from "../periods.ts";
import { standings } from "../ranking.ts";
import { renderStats } from "../render/stats.ts";
import { crosswordTimeZone } from "../settings.ts";
import { playerStats } from "../stats.ts";
import type { CrosswordRepo } from "../store/repo.ts";

/** Private: the asker's stats, or another member's. */
export const stats = statsHandler({
  timeZone: crosswordTimeZone,
  periodRange,
  finishedIn: (repo: CrosswordRepo, guildId, range) => repo.games.finishedIn(guildId, range),
  finishedBy: (repo: CrosswordRepo, guildId, userId) => repo.games.finishedBy(guildId, userId),
  standings,
  playerStats,
  renderStats,
});
