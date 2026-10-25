import type { FiaDocument, FiaPage } from "./types.ts";
/** The F1 championship's documents page: the latest event's documents, newest first. */
export const FIA_DOCUMENTS =
  "https://www.fia.com/documents/championships/fia-formula-one-world-championship-14";

const FIA_ORIGIN = "https://www.fia.com";

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&#039;": "'",
  "&quot;": '"',
  "&lt;": "<",
  "&gt;": ">",
};

const decode = (s: string): string =>
  s.replaceAll(/&(amp|#039|quot|lt|gt);/g, (e) => ENTITIES[e] ?? e);

export const squash = (s: string): string => s.replaceAll(/\s+/g, " ").trim();

const paris = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Paris",
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** How far Paris wall-clock time is ahead of UTC at instant `utc`. */
function parisOffsetMs(utc: number): number {
  const parts = paris.formatToParts(new Date(utc));
  const get = (type: string): number => Number(parts.find((p) => p.type === type)?.value);
  const wall = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return wall - Math.floor(utc / 60_000) * 60_000;
}

/**
 * "10.10.26 16:20" → that instant. The page labels these "CET", but they are Paris
 * wall-clock times, summer time included.
 */
export function parisTime(text: string): Date | null {
  const m = /^(\d\d)\.(\d\d)\.(\d\d) (\d\d):(\d\d)$/.exec(text.trim());
  if (!m) return null;
  const [, dd, mm, yy, hh, min] = m.map(Number);
  const wall = Date.UTC(2000 + (yy ?? 0), (mm ?? 1) - 1, dd, hh, min);
  const guess = wall - parisOffsetMs(wall);
  return new Date(wall - parisOffsetMs(guess));
}

const ROW =
  /<li class="document-row[^"]*">\s*<a href="([^"]+\.pdf)"[\s\S]*?<div class="title">([\s\S]*?)<\/div>[\s\S]*?date-display-single">([^<]+)</g;

export function parseFiaDocuments(html: string): FiaPage {
  const event = /<div class="event-title active">([^<]+)</.exec(html)?.[1];
  const documents: FiaDocument[] = [];
  for (const [, href = "", rawTitle = "", published = ""] of html.matchAll(ROW)) {
    const publishedAt = parisTime(published);
    if (!publishedAt) continue;
    documents.push({
      url: href.startsWith("/") ? FIA_ORIGIN + href : href,
      title: squash(decode(rawTitle)).replace(/^Doc \d+ - /, ""),
      publishedAt,
    });
  }
  return { event: event ? squash(decode(event)) : null, documents };
}

/** Stewards' rulings about a car; summons, deleted lap times and notices aren't. */
export const isRuling = (title: string): boolean =>
  /^(Decision|Infringement) - Car \d+/i.test(title);
