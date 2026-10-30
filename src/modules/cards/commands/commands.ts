import type { ChatInputCommandInteraction } from "discord.js";
import { reply } from "../../../core/replies.ts";
import type { Ctx, SlashCommand } from "../../../core/types.ts";
import { CardsRepo } from "../store/repo.ts";
import { leaderboard, stats } from "./boards.ts";
import { data } from "./data.ts";
import { add, list, remove } from "./deck.ts";
import { start, stop } from "./game.ts";
import type { Handler } from "./types.ts";

const HANDLERS: Record<string, Handler> = { start, stop, add, remove, list, leaderboard, stats };

export function cardsCommand(random: () => number): SlashCommand {
  async function execute(i: ChatInputCommandInteraction, ctx: Ctx): Promise<void> {
    const handler = HANDLERS[i.options.getSubcommand()];

    if (!i.guildId) return reply(i, "Gork Cards works in a server.");

    if (!handler) return reply(i, "Unknown subcommand.");

    await handler({ i, guildId: i.guildId, ctx, repo: new CardsRepo(ctx.db), random });
  }

  return { data, execute };
}
