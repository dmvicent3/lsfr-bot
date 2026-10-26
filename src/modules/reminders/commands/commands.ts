import type { ChatInputCommandInteraction } from "discord.js";
import type { Ctx, SlashCommand } from "../../../core/types.ts";
import { ReminderStore } from "../store/reminders.ts";
import { data } from "./data.ts";
import { reply } from "./kit.ts";
import { list } from "./list.ts";
import { set } from "./set.ts";
import type { Handler } from "./types.ts";

const HANDLERS: Record<string, Handler> = { set, list };

async function execute(i: ChatInputCommandInteraction, ctx: Ctx): Promise<void> {
  const guildId = i.guildId;

  if (!guildId) return reply(i, "Use this in a server.");

  const handler = HANDLERS[i.options.getSubcommand()];

  if (!handler) return reply(i, "Unknown subcommand.");

  await handler({ i, guildId, store: new ReminderStore(ctx.db) });
}

export const remindCommand: SlashCommand = { data, global: true, execute };
