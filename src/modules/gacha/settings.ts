import type { Database } from "bun:sqlite";
import { getSetting, setSetting } from "../../core/settings.ts";
import { zoneSetting } from "../../core/zone-setting.ts";
import { PRICE_RANGE } from "./engine/balance.ts";

/**
 * Currency a pull costs unless the server sets its own. A player who finishes all nine dailies
 * with typical good results and a full streak earns about 1,460 points a day, ~10,200 a week:
 * 73 pulls at 140, one ★5 50/50 (~62–75 pulls) a week.
 */
export const DEFAULT_PRICE = 140;

const zone = zoneSetting("gacha");
const channelKey = (guildId: string): string => `gacha.channel.${guildId}`;
const priceKey = (guildId: string): string => `gacha.price.${guildId}`;

/** The week's time zone; unset or no longer valid is the default. */
export const gachaTimeZone = (db: Database, guildId: string): string => zone.get(db, guildId);

/** Returns what was wrong, or null once saved. */
export const saveGachaTimeZone = (db: Database, guildId: string, tz: string): string | null =>
  zone.save(db, guildId, tz);

/** Where polls and banner news go; null until an admin sets it. */
export const gachaChannel = (db: Database, guildId: string): string | null =>
  getSetting(db, channelKey(guildId));

export const setGachaChannel = (db: Database, guildId: string, channelId: string): void =>
  setSetting(db, channelKey(guildId), channelId);

export function gachaPrice(db: Database, guildId: string): number {
  const set = Number(getSetting(db, priceKey(guildId)));

  return Number.isInteger(set) && set >= PRICE_RANGE.min ? set : DEFAULT_PRICE;
}

/** Returns what was wrong, or null once saved. */
export function saveGachaPrice(db: Database, guildId: string, price: number): string | null {
  if (!Number.isInteger(price) || price < PRICE_RANGE.min || price > PRICE_RANGE.max) {
    return `The price must be a whole number from ${PRICE_RANGE.min} to ${PRICE_RANGE.max}.`;
  }

  setSetting(db, priceKey(guildId), String(price));

  return null;
}
