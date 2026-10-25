import { type ChatInputCommandInteraction, MessageFlags } from "discord.js";
import type { RssRepo } from "../store/repo.ts";

/** What every /rss subcommand gets: the interaction, the server and its rss tables. */
export interface CommandCtx {
  i: ChatInputCommandInteraction;
  guildId: string;
  repo: RssRepo;
}

export type Handler = (c: CommandCtx) => Promise<void>;

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
