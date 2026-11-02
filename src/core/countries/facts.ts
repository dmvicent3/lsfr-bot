import { isRecord, isString } from "../guards.ts";
import type { Continent, Facts, FlagColour, FlagFeature, Language, Membership } from "./types.ts";

export const CONTINENTS: readonly Continent[] = [
  "africa",
  "asia",
  "europe",
  "north_america",
  "south_america",
  "oceania",
];
export const MEMBERSHIPS: readonly Membership[] = ["eu", "nato", "commonwealth", "brics", "opec"];
export const LANGUAGES: readonly Language[] = ["en", "fr", "es", "ar", "pt"];
export const FLAG_COLOURS: readonly FlagColour[] = [
  "red",
  "blue",
  "green",
  "yellow",
  "white",
  "black",
  "orange",
];
export const FLAG_FEATURES: readonly FlagFeature[] = ["star", "crescent", "emblem"];

export function emptyFacts(): Facts {
  return {
    continents: [],
    borders: [],
    landlocked: null,
    island: null,
    memberships: [],
    languages: [],
    monarchy: null,
    drivesLeft: null,
    flagColours: [],
    flagFeatures: [],
    aliases: [],
  };
}

function pick<T extends string>(raw: unknown, allowed: readonly T[]): T[] {
  const list = Array.isArray(raw) ? (raw as unknown[]) : [];

  return allowed.filter((a) => list.includes(a));
}

function strings(raw: unknown): string[] {
  return Array.isArray(raw) ? (raw as unknown[]).filter(isString) : [];
}

const flag = (raw: unknown): boolean | null => (typeof raw === "boolean" ? raw : null);

/** Validates stored facts; anything missing or malformed becomes an empty list or null. */
export function loadFacts(raw: unknown): Facts {
  const r = isRecord(raw) ? raw : {};

  return {
    continents: pick(r.continents, CONTINENTS),
    borders: strings(r.borders),
    landlocked: flag(r.landlocked),
    island: flag(r.island),
    memberships: pick(r.memberships, MEMBERSHIPS),
    languages: pick(r.languages, LANGUAGES),
    monarchy: flag(r.monarchy),
    drivesLeft: flag(r.drivesLeft),
    flagColours: pick(r.flagColours, FLAG_COLOURS),
    flagFeatures: pick(r.flagFeatures, FLAG_FEATURES),
    aliases: strings(r.aliases),
  };
}
