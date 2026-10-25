import type { FeedItem } from "./types.ts";

/**
 * What makes two items the same article: the guid, else the link without its fragment and utm_*
 * parameters (host lowercased by URL). No guid and no link: no key, and the item is skipped.
 */
export function itemKey(item: Pick<FeedItem, "guid" | "link">): string | null {
  const guid = item.guid?.trim();
  if (guid) return guid;
  const link = item.link?.trim();
  if (!link) return null;
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return link;
  }
  url.hash = "";
  for (const name of Array.from(url.searchParams.keys())) {
    if (name.toLowerCase().startsWith("utm_")) url.searchParams.delete(name);
  }
  return url.toString();
}

/** An absolute http(s) URL, normalised; null for anything else (Discord refuses those in embeds). */
export function httpUrl(s: string | null): string | null {
  if (!s) return null;
  try {
    const url = new URL(s);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
