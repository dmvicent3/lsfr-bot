import type { Database } from "bun:sqlite";
import type { ChatInputCommandInteraction, InteractionReplyOptions } from "discord.js";
import { toPeriod } from "./page-args.ts";
import type { Period } from "./types.ts";

interface PageAsk {
  guildId: string;
  period: Period;
  page: number;
  viewerId: string;
  now: number;
}

/** The `leaderboard` subcommand: public, so the server sees it; the module's view decides what pings. */
export function leaderboardHandler<R>(
  view: (db: Database, repo: R, v: PageAsk) => InteractionReplyOptions,
): (c: {
  i: ChatInputCommandInteraction;
  guildId: string;
  db: Database;
  repo: R;
}) => Promise<void> {
  return async ({ i, guildId, db, repo }) => {
    const period = toPeriod(i.options.getString("period"));
    const page = i.options.getInteger("page") ?? 1;

    await i.reply(view(db, repo, { guildId, period, page, viewerId: i.user.id, now: Date.now() }));
  };
}
