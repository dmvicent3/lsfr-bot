import type { Database } from "bun:sqlite";
import { getSetting, setSetting } from "./settings.ts";
import { isTimeZone } from "./zoned.ts";

export const DEFAULT_TIME_ZONE = "Europe/Lisbon";

export type ZoneSetting = {
  /** The server's time zone; unset or no longer valid is the default. */
  get: (db: Database, guildId: string) => string;
  /** Returns what was wrong, or null once saved. */
  save: (db: Database, guildId: string, tz: string) => string | null;
};

/** A per-server time zone setting stored under `<prefix>.timezone.<guildId>`. */
export function zoneSetting(prefix: string): ZoneSetting {
  const key = (guildId: string): string => `${prefix}.timezone.${guildId}`;

  return {
    get(db, guildId) {
      const tz = getSetting(db, key(guildId)) ?? DEFAULT_TIME_ZONE;

      return isTimeZone(tz) ? tz : DEFAULT_TIME_ZONE;
    },
    save(db, guildId, tz) {
      if (!isTimeZone(tz)) return `Unknown time zone: ${tz}.`;

      setSetting(db, key(guildId), tz);

      return null;
    },
  };
}
