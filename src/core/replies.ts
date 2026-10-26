import { type ChatInputCommandInteraction, MessageFlags } from "discord.js";

/** An ephemeral reply, or the deferred reply's edit; pings no one, whatever text it quotes. */
export async function reply(i: ChatInputCommandInteraction, content: string): Promise<void> {
  const allowedMentions = { parse: [] };
  await (i.deferred
    ? i.editReply({ content, allowedMentions })
    : i.reply({ content, flags: MessageFlags.Ephemeral, allowedMentions }));
}

/** Choices matching what was typed, within Discord's 25 choices of 100 characters. */
export function autocompleteChoices(
  items: { name: string; value: string }[],
  typed: string,
): { name: string; value: string }[] {
  const t = typed.toLowerCase();

  return items
    .filter((c) => c.name.toLowerCase().includes(t))
    .slice(0, 25)
    .map((c) => ({ name: c.name.slice(0, 100), value: c.value }));
}
