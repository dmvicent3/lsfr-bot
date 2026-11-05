import { MessageFlags } from "discord.js";
import { rankOf } from "../../../core/daily.ts";
import { dateIn } from "../../../core/zoned.ts";
import { periodStandings } from "../play/standings.ts";
import { type Ranks, renderStats } from "../render/stats.ts";
import { wordSettings } from "../settings.ts";
import { playerStats } from "../stats.ts";
import type { WordRepo } from "../store/repo.ts";
import type { Period, Track } from "../types.ts";
import type { Handler } from "./types.ts";

function ranksOf(
  repo: WordRepo,
  track: Track,
  who: { guildId: string; userId: string; today: string },
): Ranks {
  const of = (period: Period): Ranks[Period] => {
    const { list } = periodStandings(repo, track, { ...who, period });
    const rank = rankOf(list, who.userId);

    return rank === null ? null : { rank, of: list.length };
  };

  return { today: of("today"), week: of("week"), month: of("month"), all: of("all") };
}

/** A game's `stats` subcommand, private: the asker's stats, or another member's. */
export const statsFor =
  (track: Track): Handler =>
  async ({ i, guildId, db, repo }) => {
    const userId = (i.options.getUser("user") ?? i.user).id;
    const today = dateIn(Date.now(), wordSettings(db, guildId).timeZone);
    const content = renderStats({
      name: track.name,
      userId,
      stats: playerStats(track.finishedBy(repo, guildId, userId), today, track.maxAttempts),
      ranks: ranksOf(repo, track, { guildId, userId, today }),
    });

    await i.reply({ content, flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
  };
