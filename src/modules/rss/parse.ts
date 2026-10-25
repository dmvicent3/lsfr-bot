import { XMLParser } from "fast-xml-parser";
import { isRecord } from "../../core/guards.ts";

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

const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
};

function decodeEntities(s: string): string {
  return s.replaceAll(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code.startsWith("#")) {
      const n =
        code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : Number(code.slice(1));
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : whole;
    }
    return NAMED[code.toLowerCase()] ?? whole;
  });
}

/** HTML or text as one line of plain text. */
function plain(html: string): string {
  const noTags = html
    .replaceAll(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replaceAll(/<[^>]*>/g, " ");
  return decodeEntities(decodeEntities(noTags)).replaceAll(/\s+/g, " ").trim();
}

/** An element's text: a string, a number, or `{"#text": …}` when it has attributes. */
function text(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (isRecord(value)) return text(value["#text"]);
  return "";
}

function attr(value: unknown, name: string): string {
  return isRecord(value) ? text(value[`@_${name}`]) : "";
}

function list(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return value === undefined ? [] : [value];
}

function date(value: unknown): number | null {
  const s = text(value).trim();
  if (!s) return null;
  const ms = Date.parse(s);
  return Number.isNaN(ms) ? null : ms;
}

function orNull(s: string): string | null {
  const t = s.trim();
  return t ? t : null;
}

function rssImage(item: Record<string, unknown>): string | null {
  for (const key of ["media:content", "media:thumbnail"]) {
    for (const m of list(item[key])) {
      const url = attr(m, "url");
      if (
        url &&
        (key === "media:thumbnail" || !attr(m, "medium") || attr(m, "medium") === "image")
      ) {
        return url;
      }
    }
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

/** RSS 2.0 or Atom XML as a feed of at most MAX_ITEMS items; anything else is a FeedError. */
export function parseFeed(xml: string): ParsedFeed {
  let doc: unknown;
  try {
    doc = parser.parse(xml.trimStart());
  } catch (err) {
    throw new FeedError(`not valid XML: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!isRecord(doc)) throw new FeedError("not an RSS or Atom feed");
  const rss = doc["rss"];
  const channel = isRecord(rss) ? rss["channel"] : undefined;
  if (isRecord(channel)) {
    return {
      title: plain(text(channel["title"])),
      items: list(channel["item"]).filter(isRecord).slice(0, MAX_ITEMS).map(rssItem),
    };
  }
  const atom = doc["feed"];
  if (isRecord(atom)) {
    return {
      title: plain(text(atom["title"])),
      items: list(atom["entry"]).filter(isRecord).slice(0, MAX_ITEMS).map(atomEntry),
    };
  }
  throw new FeedError("not an RSS or Atom feed");
}
