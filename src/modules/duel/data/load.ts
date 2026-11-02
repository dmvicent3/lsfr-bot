import { readFileSync } from "node:fs";
import { isRecord, isString, records } from "../../../core/guards.ts";
import { log } from "../../../core/log.ts";
import type { Country, Reading, Snapshot, StatId } from "../types.ts";
import { STAT_BY_ID } from "./stats.ts";

function reading(raw: unknown): Reading | null {
  if (!isRecord(raw)) return null;

  const { value, year } = raw;

  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;

  return typeof year === "number" && Number.isInteger(year) ? { value, year } : null;
}

function isStatId(id: string): id is StatId {
  return Object.hasOwn(STAT_BY_ID, id);
}

function values(iso2: string, raw: unknown): Country["values"] {
  const out: Country["values"] = {};

  for (const [id, entry] of Object.entries(isRecord(raw) ? raw : {})) {
    const r = isStatId(id) ? reading(entry) : null;

    if (r && isStatId(id)) out[id] = r;
    else log.info("duel", `dropped bad reading ${iso2}.${id}`);
  }

  return out;
}

function country(raw: Record<string, unknown>): Country | null {
  if (!isString(raw.iso2) || !isString(raw.name)) return null;

  return { iso2: raw.iso2, name: raw.name, values: values(raw.iso2, raw.values) };
}

/** Validates a parsed snapshot; null when the shape is unusable. */
export function loadSnapshot(raw: unknown): Snapshot | null {
  if (!isRecord(raw) || !Array.isArray(raw.countries)) return null;

  const countries = records(raw.countries)
    .map(country)
    .filter((c) => c !== null);

  return { builtAt: isString(raw.builtAt) ? raw.builtAt : "", countries };
}

const DEFAULT_PATH = new URL("countries.json", import.meta.url);

/** Once-per-process cache: the snapshot never changes while the bot runs. */
let cache: Snapshot | null | undefined;

export function readSnapshot(path: string | URL = DEFAULT_PATH): Snapshot | null {
  if (cache !== undefined) return cache;

  try {
    cache = loadSnapshot(JSON.parse(readFileSync(path, "utf8")));
  } catch (err) {
    log.error("duel", "country data unreadable", err);
    cache = null;
  }

  return cache;
}
