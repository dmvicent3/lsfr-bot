import type {
  ChatInputCommandInteraction,
  InteractionReplyOptions,
  MessageComponentInteraction,
} from "discord.js";
import { MessageFlags } from "discord.js";

/** An ephemeral reply that pings no one, whatever reminder text it quotes. */
export async function reply(
  i: ChatInputCommandInteraction | MessageComponentInteraction,
  message: string | Omit<InteractionReplyOptions, "flags">,
): Promise<void> {
  const body = typeof message === "string" ? { content: message } : message;
  await i.reply({ ...body, flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
}
