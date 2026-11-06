import type { Database } from "bun:sqlite";
import { zoneSetting } from "../../core/zone-setting.ts";

const zone = zoneSetting("minesweeper");

/** The server's time zone for the daily; no command sets it yet, so it is the default. */
export const minesweeperTimeZone = (db: Database, guildId: string): string =>
  zone.get(db, guildId);
