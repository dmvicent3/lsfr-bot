import { type ChatInputCommandInteraction, InteractionContextType } from "discord.js";
import type { Ctx, SlashCommand } from "../../core/types.ts";
import { checklist } from "./checklist.ts";
import { todayEntries } from "./sources/today.ts";

export const data = {
  name: "dailies",
  description: "Your daily games for today: done, started and still to play",
  contexts: [InteractionContextType.Guild],
};

/** Public: the caller's checklist for today. */
export async function execute(i: ChatInputCommandInteraction, ctx: Ctx): Promise<void> {
  if (!i.guildId) return;

  const now = Date.now();
  const entries = todayEntries(ctx.db, { guildId: i.guildId, userId: i.user.id }, now);

  await i.reply({ embeds: [checklist(i.user.displayName, entries, ctx.commandIds, now)] });
}

export const dailiesCommand: SlashCommand = { data, execute };
