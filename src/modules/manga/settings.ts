import type { Database } from "bun:sqlite";
import { getSetting, setSetting } from "../../core/settings.ts";

const CHANNEL_KEY = "manga.channel";

/** Where chapter posts go; null until an admin sets it. */
export function mangaChannel(db: Database): string | null {
  return getSetting(db, CHANNEL_KEY);
}

export function setMangaChannel(db: Database, channelId: string): void {
  setSetting(db, CHANNEL_KEY, channelId);
}
