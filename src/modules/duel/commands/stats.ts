import { statsHandler } from "../../../core/stats-command.ts";
import { periodRange } from "../periods.ts";
import { standings } from "../ranking.ts";
import { renderStats } from "../render/stats.ts";
import { duelTimeZone } from "../settings.ts";
import { playerStats } from "../stats.ts";
import type { DuelRepo } from "../store/repo.ts";

/** Private: the asker's stats, or another member's. */
export const stats = statsHandler({
  timeZone: duelTimeZone,
  periodRange,
  finishedIn: (repo: DuelRepo, guildId, range) => repo.games.finishedIn(guildId, range),
  finishedBy: (repo: DuelRepo, guildId, userId) => repo.games.finishedBy(guildId, userId),
  standings,
  playerStats,
  renderStats,
});
