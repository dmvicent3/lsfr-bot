import type { ChatInputCommandInteraction } from "discord.js";
import type { Snapshot } from "../../../core/countries/types.ts";
import { reply } from "../../../core/replies.ts";
import type { Ctx, SlashCommand } from "../../../core/types.ts";
import { GridRepo } from "../store/repo.ts";
import { data } from "./data.ts";
import { leaderboard } from "./leaderboard.ts";
import { play } from "./play.ts";
import { practice } from "./practice.ts";
import { settings } from "./settings.ts";
import { stats } from "./stats.ts";
import type { Handler } from "./types.ts";

const HANDLERS: Record<string, Handler> = { play, practice, stats, leaderboard, settings };

export function gridCommand(
  snapshotSource: () => Snapshot | null,
  random: () => number = Math.random,
): SlashCommand {
  async function execute(i: ChatInputCommandInteraction, ctx: Ctx): Promise<void> {
    const handler = HANDLERS[i.options.getSubcommand()];

    if (!i.guildId) return reply(i, "Country grid works in a server.");

    if (!handler) return reply(i, "Unknown subcommand.");

    const repo = new GridRepo(ctx.db);

    await handler({ i, guildId: i.guildId, db: ctx.db, repo, snapshotSource, random });
  }

  return { data, execute };
}
