import type { APIEmbed } from "discord.js";
import type { FeedItem } from "./parse.ts";

const MAX_TITLE = 256;
const MAX_DESCRIPTION = 300;

function cut(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function renderItem(item: FeedItem, feedName: string): APIEmbed {
  return {
    title: cut(item.title || "(untitled)", MAX_TITLE),
    ...(item.link ? { url: item.link } : {}),
    ...(item.description ? { description: cut(item.description, MAX_DESCRIPTION) } : {}),
    footer: { text: feedName },
    ...(item.publishedAt === null ? {} : { timestamp: new Date(item.publishedAt).toISOString() }),
    ...(item.image ? { image: { url: item.image } } : {}),
  };
}
