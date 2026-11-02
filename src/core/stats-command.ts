import type { Database } from "bun:sqlite";
import { MessageFlags } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import { periodRanks, rankOf } from "./daily.ts";
import type { DateRange, Period } from "./types.ts";
import { dateIn } from "./zoned.ts";

/** What differs between daily games' `stats` subcommands; `G` is a module's game list, `S` its stats. */
export interface StatsSpec<R, G extends readonly unknown[], S> {
  timeZone: (db: Database, guildId: string) => string;
  periodRange: (p: Period, today: string) => DateRange;
  finishedIn: (repo: R, guildId: string, range: DateRange) => G;
  finishedBy: (repo: R, guildId: string, userId: string) => G;
  standings: (games: G) => readonly { userId: string }[];
  playerStats: (games: G, today: string) => S;
  renderStats: (name: string, stats: S, ranks: Record<Period, number | null>) => string;
}

/** The `stats` subcommand: private, the asker's numbers or another member's (`user` option). */
export function statsHandler<R, G extends readonly unknown[], S>(
  spec: StatsSpec<R, G, S>,
): (c: {
  i: ChatInputCommandInteraction;
  guildId: string;
  db: Database;
  repo: R;
}) => Promise<void> {
  return async ({ i, guildId, db, repo }) => {
    const user = i.options.getUser("user") ?? i.user;
    const today = dateIn(Date.now(), spec.timeZone(db, guildId));
    const rank = (p: Period): number | null =>
      rankOf(spec.standings(spec.finishedIn(repo, guildId, spec.periodRange(p, today))), user.id);
    const content = spec.renderStats(
      user.displayName,
      spec.playerStats(spec.finishedBy(repo, guildId, user.id), today),
      periodRanks(rank),
    );

    await i.reply({ content, flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
  };
}
