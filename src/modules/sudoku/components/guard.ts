import { type MessageComponentInteraction, MessageFlags } from "discord.js";

export const STALE =
  "This board is out of date. Open a new one with /sudoku daily or /sudoku practice.";

/** An ephemeral answer to a click; pings no one. */
export async function tell(i: MessageComponentInteraction, content: string): Promise<void> {
  await i.reply({ content, flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
}
