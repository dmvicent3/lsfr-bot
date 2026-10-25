import { XMLParser } from "fast-xml-parser";
import { isRecord } from "../../../core/guards.ts";
import { attr, date, list, orNull, plain, text } from "./xml-text.ts";

export interface FeedItem {
  title: string;
  link: string | null;
  guid: string | null;
  /** Plain text: tags stripped, entities decoded, whitespace collapsed. */
  description: string;
  publishedAt: number | null;
  image: string | null;
}

export interface ParsedFeed {
  title: string;
  items: FeedItem[];
}

export class FeedError extends Error {
  override name = "FeedError";
}

export const MAX_ITEMS = 50;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: false,
  isArray: (name) =>
    ["item", "entry", "link", "media:content", "media:thumbnail", "enclosure"].includes(name),
});

/** media:content counts only when it is (or doesn't say it isn't) an image. */
function mediaImage(m: unknown, key: string): string {
  const medium = attr(m, "medium");
  const image = key === "media:thumbnail" || !medium || medium === "image";
  return image ? attr(m, "url") : "";
}

function rssImage(item: Record<string, unknown>): string | null {
  for (const key of ["media:content", "media:thumbnail"]) {
    const url = list(item[key])
      .map((m) => mediaImage(m, key))
      .find(Boolean);
    if (url) return url;
  }
  const enclosure = list(item["enclosure"]).find((e) => attr(e, "type").startsWith("image/"));
  return orNull(attr(enclosure, "url"));
}

function rssItem(item: Record<string, unknown>): FeedItem {
  return {
    title: plain(text(item["title"])),
    link: orNull(
      list(item["link"])
        .map(text)
        .find((l) => l.trim()) ?? "",
    ),
    guid: orNull(text(item["guid"])),
    description: plain(text(item["description"])),
    publishedAt: date(item["pubDate"]) ?? date(item["dc:date"]),
    image: rssImage(item),
  };
}

function atomLink(links: unknown[]): string | null {
  const alternate =
    links.find((l) => attr(l, "rel") === "alternate") ?? links.find((l) => !attr(l, "rel"));
  return orNull(attr(alternate, "href"));
}

function atomEntry(entry: Record<string, unknown>): FeedItem {
  return {
    title: plain(text(entry["title"])),
    link: atomLink(list(entry["link"])),
    guid: orNull(text(entry["id"])),
    description: plain(text(entry["summary"]) || text(entry["content"])),
    publishedAt: date(entry["published"]) ?? date(entry["updated"]),
    image: rssImage(entry),
  };
}

function parseXml(xml: string): Record<string, unknown> {
  let doc: unknown;
  try {
    doc = parser.parse(xml.trimStart());
  } catch (err) {
    throw new FeedError(`not valid XML: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!isRecord(doc)) throw new FeedError("not an RSS or Atom feed");
  return doc;
}

function feedOf(
  root: unknown,
  itemsKey: string,
  toItem: (r: Record<string, unknown>) => FeedItem,
): ParsedFeed | null {
  if (!isRecord(root)) return null;
  return {
    title: plain(text(root["title"])),
    items: list(root[itemsKey]).filter(isRecord).slice(0, MAX_ITEMS).map(toItem),
  };
}

/** RSS 2.0 or Atom XML as a feed of at most MAX_ITEMS items; anything else is a FeedError. */
export function parseFeed(xml: string): ParsedFeed {
  const doc = parseXml(xml);
  const rss = doc["rss"];
  const feed =
    feedOf(isRecord(rss) ? rss["channel"] : undefined, "item", rssItem) ??
    feedOf(doc["feed"], "entry", atomEntry);
  if (!feed) throw new FeedError("not an RSS or Atom feed");
  return feed;
}
