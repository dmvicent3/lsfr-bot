import type { ChatInputCommandInteraction } from "discord.js";
import { reply } from "../../../core/replies.ts";
import type { Ctx, SlashCommand } from "../../../core/types.ts";
import { TriviaRepo } from "../store/repo.ts";
import { data } from "./data.ts";
import { leaderboard } from "./leaderboard.ts";
import { report } from "./report.ts";
import { reports } from "./reports.ts";
import { start } from "./start.ts";
import { stats } from "./stats.ts";
import { stop } from "./stop.ts";
import type { Handler } from "./types.ts";

const HANDLERS: Record<string, Handler> = { start, stop, leaderboard, stats, report, reports };

export function triviaCommand(random: () => number): SlashCommand {
  async function execute(i: ChatInputCommandInteraction, ctx: Ctx): Promise<void> {
    const handler = HANDLERS[i.options.getSubcommand()];

    if (!i.guildId) return reply(i, "Trivia works in a server.");

    if (!handler) return reply(i, "Unknown subcommand.");

    await handler({ i, guildId: i.guildId, ctx, repo: new TriviaRepo(ctx.db), random });
  }

  return { data, execute };
}
