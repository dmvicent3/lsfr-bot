import type { Database } from "bun:sqlite";
import { zoneSetting } from "../../core/zone-setting.ts";

const zone = zoneSetting("crossword");

/** The server time zone; unset or no longer valid is the default. */
export const crosswordTimeZone = (db: Database, guildId: string): string => zone.get(db, guildId);

/** Returns what was wrong, or null once saved. */
export const saveCrosswordTimeZone = (db: Database, guildId: string, tz: string): string | null =>
  zone.save(db, guildId, tz);
