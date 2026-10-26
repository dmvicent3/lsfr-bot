import type { CommandCtx } from "./types.ts";
import { type ChatInputCommandInteraction, MessageFlags } from "discord.js";

/** An ephemeral reply, or the deferred reply's edit. */
export async function reply(i: ChatInputCommandInteraction, content: string): Promise<void> {
  await (i.deferred
    ? i.editReply({ content })
    : i.reply({ content, flags: MessageFlags.Ephemeral }));
}

/** Where news goes, for replies: "in #news" or how to set a channel. */
export function channelHint({ repo, guildId }: CommandCtx): string {
  const channel = repo.servers.channel(guildId);

  return channel ? `in <#${channel}>` : "once a channel is set with `/rss channel`";
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
