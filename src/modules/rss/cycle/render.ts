import type { APIEmbed } from "discord.js";
import type { FeedItem } from "../feeds/types.ts";
import { httpUrl } from "../feeds/urls.ts";

const MAX_TITLE = 256;
const MAX_DESCRIPTION = 300;
const MAX_FOOTER = 100;

function cut(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function renderItem(item: FeedItem, feedName: string): APIEmbed {
  const url = httpUrl(item.link);
  const image = httpUrl(item.image);
  return {
    title: cut(item.title || "(untitled)", MAX_TITLE),
    ...(url ? { url } : {}),
    ...(item.description ? { description: cut(item.description, MAX_DESCRIPTION) } : {}),
    footer: { text: cut(feedName, MAX_FOOTER) },
    ...(item.publishedAt === null ? {} : { timestamp: new Date(item.publishedAt).toISOString() }),
    ...(image ? { image: { url: image } } : {}),
  };
}
