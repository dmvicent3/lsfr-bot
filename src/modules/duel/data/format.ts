import type { Reading, StatId, Unit } from "../types.ts";
import { STAT_BY_ID } from "./stats.ts";

const num = (v: number, dp = 0): string =>
  v.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });

const FORMATTERS: Record<Unit, (v: number) => string> = {
  int: (v) => num(v),
  km2: (v) => `${num(v)} km²`,
  per_km2: (v) => `${num(v)} /km²`,
  usd: (v) => `$${num(v)}`,
  years: (v) => `${num(v, 1)} years`,
  pct: (v) => `${num(v, 1)}%`,
  t: (v) => `${num(v, 1)} t`,
  dp2: (v) => num(v, 2),
  m: (v) => `${num(v)} m`,
};

/** A reading as shown to players, formatted by its stat's unit. */
export function formatValue(stat: StatId, r: Reading): string {
  return FORMATTERS[STAT_BY_ID[stat].unit](r.value);
}
