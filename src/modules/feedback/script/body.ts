import type { RESTPostAPIChannelMessageJSONBody } from "discord.js";

/** A plain message; pings no one. */
export const sayBody = (content: string): RESTPostAPIChannelMessageJSONBody => ({
  content,
  allowed_mentions: { parse: [] },
});

export const messageUrl = (guildId: string, channelId: string, messageId: string): string =>
  `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
