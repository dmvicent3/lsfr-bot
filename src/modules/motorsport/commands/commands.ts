import type { ChatInputCommandInteraction } from "discord.js";
import type { Ctx, SlashCommand } from "../../../core/types.ts";
import { MotorsportRepo } from "../repo.ts";
import { data } from "./data.ts";
import { followHandlers } from "./follow.ts";
import { infoHandlers } from "./info.ts";
import { autocomplete, reminderHandlers } from "./reminders.ts";
import type { Handler } from "./types.ts";

const HANDLERS: Record<string, Handler> = {
  ...followHandlers,
  ...reminderHandlers,
  ...infoHandlers,
};

async function execute(i: ChatInputCommandInteraction, ctx: Ctx): Promise<void> {
  const name = i.options.getSubcommand();
  const handler = HANDLERS[name];
  if (!handler) throw new Error(`Unknown subcommand ${name}`);
  await handler({ i, ctx, repo: new MotorsportRepo(ctx.db) });
}

export const motorsportCommand: SlashCommand = { data, execute, autocomplete };
