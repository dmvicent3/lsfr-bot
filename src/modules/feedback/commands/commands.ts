import type { ChatInputCommandInteraction } from "discord.js";
import { reply } from "../../../core/replies.ts";
import type { Ctx, SlashCommand } from "../../../core/types.ts";
import { OUTSIDE } from "../text.ts";
import { feedbackData } from "./data.ts";
import { give } from "./give.ts";
import { settings } from "./settings.ts";
import type { Handler } from "./types.ts";

const HANDLERS: Record<string, Handler> = { give, settings };

async function execute(i: ChatInputCommandInteraction, ctx: Ctx): Promise<void> {
  const handler = HANDLERS[i.options.getSubcommand()];

  if (!i.guildId) return reply(i, OUTSIDE);

  if (!handler) return reply(i, "Unknown subcommand.");

  await handler({ i, guildId: i.guildId, db: ctx.db });
}

export const feedbackCommand = (topics: string[]): SlashCommand => ({
  data: feedbackData(topics),
  execute,
});
