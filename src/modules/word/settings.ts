import type { Database } from "bun:sqlite";
import { getSetting, setSetting } from "../../core/settings.ts";
import { DEFAULT_TIME_ZONE, zoneSetting } from "../../core/zone-setting.ts";
import type { WordSettings } from "./types.ts";
import { SUPPORTED_LENGTHS } from "./words/load.ts";

export const DEFAULT_SETTINGS: WordSettings = { length: 5, timeZone: DEFAULT_TIME_ZONE };

const lengthKey = (guildId: string): string => `word.length.${guildId}`;
const zone = zoneSetting("word");

/** The server's settings; anything unset or no longer valid is the default. */
export function wordSettings(db: Database, guildId: string): WordSettings {
  const length = Number(getSetting(db, lengthKey(guildId)));

  return {
    length: SUPPORTED_LENGTHS.includes(length) ? length : DEFAULT_SETTINGS.length,
    timeZone: zone.get(db, guildId),
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

  if (change.timeZone !== undefined) {
    const error = zone.save(db, guildId, change.timeZone);

    if (error) return error;
  }

  if (change.length !== undefined) setSetting(db, lengthKey(guildId), String(change.length));

  return null;
}
