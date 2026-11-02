import type { Database } from "bun:sqlite";
import { getSetting, setSetting } from "../../core/settings.ts";
import { isTimeZone } from "../../core/zoned.ts";

export const DEFAULT_TIME_ZONE = "Europe/Lisbon";

const zoneKey = (guildId: string): string => `sudoku.timezone.${guildId}`;

/** The server's time zone; unset or no longer valid is the default. */
export function sudokuTimeZone(db: Database, guildId: string): string {
  const tz = getSetting(db, zoneKey(guildId)) ?? DEFAULT_TIME_ZONE;

  return isTimeZone(tz) ? tz : DEFAULT_TIME_ZONE;
}

/** Returns what was wrong, or null once saved. */
export function saveSudokuTimeZone(db: Database, guildId: string, tz: string): string | null {
  if (!isTimeZone(tz)) return `Unknown time zone: ${tz}.`;

  setSetting(db, zoneKey(guildId), tz);

  return null;
}
