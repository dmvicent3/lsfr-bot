import type { ChatInputCommandInteraction } from "discord.js";
import { reply } from "../../../core/replies.ts";
import type { Ctx, SlashCommand } from "../../../core/types.ts";
import { WordRepo } from "../store/repo.ts";
import { data } from "./data.ts";
import { guess } from "./guess.ts";
import { leaderboard } from "./leaderboard.ts";
import { play } from "./play.ts";
import { settings } from "./settings.ts";
import { stats } from "./stats.ts";
import type { Handler } from "./types.ts";

const HANDLERS: Record<string, Handler> = { play, guess, stats, leaderboard, settings };

export function wordCommand(random: () => number): SlashCommand {
  async function execute(i: ChatInputCommandInteraction, ctx: Ctx): Promise<void> {
    const handler = HANDLERS[i.options.getSubcommand()];

    if (!i.guildId) return reply(i, "Word works in a server.");

    if (!handler) return reply(i, "Unknown subcommand.");

    await handler({ i, guildId: i.guildId, db: ctx.db, repo: new WordRepo(ctx.db), random });
  }

  return { data, execute };
}
