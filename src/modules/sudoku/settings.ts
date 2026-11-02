import type { Database } from "bun:sqlite";
import { DEFAULT_TIME_ZONE, zoneSetting } from "../../core/zone-setting.ts";

export { DEFAULT_TIME_ZONE };

const zone = zoneSetting("sudoku");

/** The server's time zone; unset or no longer valid is the default. */
export const sudokuTimeZone = (db: Database, guildId: string): string => zone.get(db, guildId);

/** Returns what was wrong, or null once saved. */
export const saveSudokuTimeZone = (db: Database, guildId: string, tz: string): string | null =>
  zone.save(db, guildId, tz);
