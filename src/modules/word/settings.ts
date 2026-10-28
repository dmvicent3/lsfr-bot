import type { Database } from "bun:sqlite";
import { getSetting, setSetting } from "../../core/settings.ts";
import type { WordSettings } from "./types.ts";
import { SUPPORTED_LENGTHS } from "./words/load.ts";

export const DEFAULT_SETTINGS: WordSettings = { length: 5, timeZone: "Europe/Lisbon" };

const lengthKey = (guildId: string): string => `word.length.${guildId}`;
const zoneKey = (guildId: string): string => `word.timezone.${guildId}`;

export function isTimeZone(tz: string): boolean {
  try {
    return new Intl.DateTimeFormat("en", { timeZone: tz }).resolvedOptions().timeZone !== "";
  } catch {
    return false;
  }
}

/** The server's settings; anything unset or no longer valid is the default. */
export function wordSettings(db: Database, guildId: string): WordSettings {
  const length = Number(getSetting(db, lengthKey(guildId)));
  const timeZone = getSetting(db, zoneKey(guildId)) ?? DEFAULT_SETTINGS.timeZone;

  return {
    length: SUPPORTED_LENGTHS.includes(length) ? length : DEFAULT_SETTINGS.length,
    timeZone: isTimeZone(timeZone) ? timeZone : DEFAULT_SETTINGS.timeZone,
  };
}

/** Saves both or neither; returns what was wrong, or null once saved. */
export function saveWordSettings(
  db: Database,
  guildId: string,
  change: Partial<WordSettings>,
): string | null {
  if (change.length !== undefined && !SUPPORTED_LENGTHS.includes(change.length)) {
    return "Lengths are 4 to 7.";
  }

  if (change.timeZone !== undefined && !isTimeZone(change.timeZone)) {
    return `Unknown time zone: ${change.timeZone}.`;
  }

  if (change.length !== undefined) setSetting(db, lengthKey(guildId), String(change.length));

  if (change.timeZone !== undefined) setSetting(db, zoneKey(guildId), change.timeZone);

  return null;
}
