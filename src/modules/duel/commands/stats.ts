import { MessageFlags } from "discord.js";
import { periodRanks, rankOf } from "../../../core/daily.ts";
import { dateIn } from "../../../core/zoned.ts";
import { periodRange } from "../periods.ts";
import { standings } from "../ranking.ts";
import { renderStats } from "../render/stats.ts";
import { duelTimeZone } from "../settings.ts";
import { playerStats } from "../stats.ts";
import type { Period } from "../types.ts";
import type { CommandCtx } from "./types.ts";

/** Private: the asker's stats, or another member's. */
export async function stats({ i, guildId, db, repo }: CommandCtx): Promise<void> {
  const user = i.options.getUser("user") ?? i.user;
  const today = dateIn(Date.now(), duelTimeZone(db, guildId));
  const rank = (p: Period): number | null =>
    rankOf(standings(repo.games.finishedIn(guildId, periodRange(p, today))), user.id);
  const content = renderStats(
    user.displayName,
    playerStats(repo.games.finishedBy(guildId, user.id), today),
    periodRanks(rank),
  );

  await i.reply({ content, flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
}
