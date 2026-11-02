import { readFileSync } from "node:fs";
import { isRecord, isString, records } from "../guards.ts";
import { log } from "../log.ts";
import type { Country, Reading, Snapshot } from "./types.ts";

/** Which stat ids a module accepts; readings under any other id are dropped. */
export type KnownStat = (id: string) => boolean;

function reading(raw: unknown): Reading | null {
  if (!isRecord(raw)) return null;

  const { value, year } = raw;

  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;

  return typeof year === "number" && Number.isInteger(year) ? { value, year } : null;
}

function values(iso2: string, raw: unknown, known: KnownStat): Country["values"] {
  const out: Country["values"] = {};

  for (const [id, entry] of Object.entries(isRecord(raw) ? raw : {})) {
    const r = known(id) ? reading(entry) : null;

    if (r) out[id] = r;
    else log.info("countries", `dropped bad reading ${iso2}.${id}`);
  }

  return out;
}

function country(raw: Record<string, unknown>, known: KnownStat): Country | null {
  if (!isString(raw.iso2) || !isString(raw.name)) return null;

  return { iso2: raw.iso2, name: raw.name, values: values(raw.iso2, raw.values, known) };
}

/** Validates a parsed snapshot; null when the shape is unusable. */
export function loadSnapshot(raw: unknown, known: KnownStat = () => true): Snapshot | null {
  if (!isRecord(raw) || !Array.isArray(raw.countries)) return null;

  const countries = records(raw.countries)
    .map((c) => country(c, known))
    .filter((c) => c !== null);

  return { builtAt: isString(raw.builtAt) ? raw.builtAt : "", countries };
}

const DEFAULT_PATH = new URL("countries.json", import.meta.url);

/** Once-per-process cache: the snapshot never changes while the bot runs. */
let cache: Snapshot | null | undefined;

export function readSnapshot(
  known: KnownStat = () => true,
  path: string | URL = DEFAULT_PATH,
): Snapshot | null {
  if (cache !== undefined) return cache;

  try {
    cache = loadSnapshot(JSON.parse(readFileSync(path, "utf8")), known);
  } catch (err) {
    log.error("countries", "country data unreadable", err);
    cache = null;
  }

  return cache;
}
