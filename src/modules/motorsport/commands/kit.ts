import { type ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { toSeriesKey } from "../series.ts";
import type { SeriesKey } from "../types.ts";

export function seriesOption(i: ChatInputCommandInteraction): SeriesKey {
  return toSeriesKey(i.options.getString("series", true));
}

export async function reply(i: ChatInputCommandInteraction, content: string): Promise<void> {
  await i.reply({ content, flags: MessageFlags.Ephemeral });
}
