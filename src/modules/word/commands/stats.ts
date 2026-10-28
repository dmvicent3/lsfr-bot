import { MessageFlags } from "discord.js";
import { dateIn } from "../../../core/zoned.ts";
import { periodStandings } from "../play/standings.ts";
import { rankOf } from "../ranking.ts";
import { type Ranks, renderStats } from "../render/stats.ts";
import { wordSettings } from "../settings.ts";
import { playerStats } from "../stats.ts";
import type { WordRepo } from "../store/repo.ts";
import type { Period } from "../types.ts";
import type { CommandCtx } from "./types.ts";

function ranksOf(repo: WordRepo, guildId: string, userId: string, today: string): Ranks {
  const of = (p: Period): Ranks[Period] => {
    const { list } = periodStandings(repo, guildId, p, today);
    const rank = rankOf(list, userId);

    return rank === null ? null : { rank, of: list.length };
  };

  return { today: of("today"), week: of("week"), month: of("month"), all: of("all") };
}

/** Private: the asker's stats, or another member's. */
export async function stats({ i, guildId, db, repo }: CommandCtx): Promise<void> {
  const userId = (i.options.getUser("user") ?? i.user).id;
  const today = dateIn(Date.now(), wordSettings(db, guildId).timeZone);
  const content = renderStats({
    userId,
    stats: playerStats(repo.games.finishedBy(guildId, userId), today),
    ranks: ranksOf(repo, guildId, userId, today),
  });

  await i.reply({ content, flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
}
