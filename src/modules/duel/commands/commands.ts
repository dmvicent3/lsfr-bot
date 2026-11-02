import type { ChatInputCommandInteraction } from "discord.js";
import { reply } from "../../../core/replies.ts";
import type { Ctx, SlashCommand } from "../../../core/types.ts";
import { DuelRepo } from "../store/repo.ts";
import type { Snapshot } from "../types.ts";
import { data } from "./data.ts";
import { leaderboard } from "./leaderboard.ts";
import { play } from "./play.ts";
import { settings } from "./settings.ts";
import { stats } from "./stats.ts";
import type { Handler } from "./types.ts";

const HANDLERS: Record<string, Handler> = { play, stats, leaderboard, settings };

export function duelCommand(snapshotSource: () => Snapshot | null): SlashCommand {
  async function execute(i: ChatInputCommandInteraction, ctx: Ctx): Promise<void> {
    const handler = HANDLERS[i.options.getSubcommand()];

    if (!i.guildId) return reply(i, "Stat duel works in a server.");

    if (!handler) return reply(i, "Unknown subcommand.");

    const repo = new DuelRepo(ctx.db);

    await handler({ i, guildId: i.guildId, db: ctx.db, repo, snapshotSource });
  }

  return { data, execute };
}
