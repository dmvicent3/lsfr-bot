import type { ChatInputCommandInteraction } from "discord.js";
import { reply } from "../../../core/replies.ts";
import type { Ctx, SlashCommand } from "../../../core/types.ts";
import { SudokuRepo } from "../store/repo.ts";
import { daily } from "./daily.ts";
import { data } from "./data.ts";
import { leaderboard } from "./leaderboard.ts";
import { practice } from "./practice.ts";
import { settings } from "./settings.ts";
import { stats } from "./stats.ts";
import type { Handler } from "./types.ts";

const HANDLERS: Record<string, Handler> = { daily, practice, stats, leaderboard, settings };

export function sudokuCommand(random: () => number): SlashCommand {
  async function execute(i: ChatInputCommandInteraction, ctx: Ctx): Promise<void> {
    const handler = HANDLERS[i.options.getSubcommand()];

    if (!i.guildId) return reply(i, "Sudoku works in a server.");

    if (!handler) return reply(i, "Unknown subcommand.");

    await handler({ i, guildId: i.guildId, db: ctx.db, repo: new SudokuRepo(ctx.db), random });
  }

  return { data, execute };
}
