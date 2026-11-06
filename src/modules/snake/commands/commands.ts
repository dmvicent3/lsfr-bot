import type { ChatInputCommandInteraction } from "discord.js";
import { reply } from "../../../core/replies.ts";
import type { Ctx, SlashCommand } from "../../../core/types.ts";
import { SnakeRepo } from "../store/repo.ts";
import { data } from "./data.ts";
import { guess } from "./guess.ts";
import { leaderboard } from "./leaderboard.ts";
import { play } from "./play.ts";
import { practice } from "./practice.ts";
import { settings } from "./settings.ts";
import { stats } from "./stats.ts";
import type { Handler } from "./types.ts";

const HANDLERS: Record<string, Handler> = { play, guess, practice, stats, leaderboard, settings };

export function snakeCommand(random: () => number): SlashCommand {
  async function execute(i: ChatInputCommandInteraction, ctx: Ctx): Promise<void> {
    const handler = HANDLERS[i.options.getSubcommand()];

    if (!i.guildId) return reply(i, "Snake works in a server.");

    if (!handler) return reply(i, "Unknown subcommand.");

    await handler({ i, guildId: i.guildId, db: ctx.db, repo: new SnakeRepo(ctx.db), random });
  }

  return { data, execute };
}
