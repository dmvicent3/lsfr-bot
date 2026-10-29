import type { ChatInputCommandInteraction } from "discord.js";
import { reply } from "../../../core/replies.ts";
import type { Ctx, SlashCommand } from "../../../core/types.ts";
import { GameStore } from "../store/games.ts";
import { data } from "./data.ts";
import { play } from "./play.ts";
import { stats } from "./stats.ts";
import type { Handler } from "./types.ts";

const HANDLERS: Record<string, Handler> = { play, stats };

async function execute(i: ChatInputCommandInteraction, ctx: Ctx): Promise<void> {
  const handler = HANDLERS[i.options.getSubcommand()];

  if (!i.guildId) return reply(i, "Use this in a server.");

  if (!handler) return reply(i, "Unknown subcommand.");

  await handler({ i, guildId: i.guildId, ctx, store: new GameStore(ctx.db) });
}

export function minesweeperCommand(): SlashCommand {
  return { data, execute };
}
