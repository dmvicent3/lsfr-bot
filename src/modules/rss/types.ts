import type { APIEmbed } from "discord.js";

export type Message = { embeds: APIEmbed[] } | { content: string };

export interface FollowRequest {
  guildId: string;
  url: string;
  /** Shown on posts; null: the feed's title. */
  name: string | null;
}

export interface FollowDeps {
  fetchFeed: (url: string) => Promise<string>;
  now: number;
}
