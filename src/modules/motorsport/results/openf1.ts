import { asText, isRecord } from "../../../core/guards.ts";
import { lastSegment, num, qualifyingTime, raceTime } from "./openf1-times.ts";
import type { ResultKind, ResultRow, SessionResult } from "./types.ts";

export const OPENF1 = "https://api.openf1.org/v1";

const SESSION_NAME: Record<ResultKind, string> = {
  qualifying: "Qualifying",
  "sprint-qualifying": "Sprint Qualifying",
  sprint: "Sprint",
  race: "Race",
};

/** Shorter names so the table stays narrow. */
const TEAM_ALIAS: Record<string, string> = {
  "Red Bull Racing": "Red Bull",
  "Haas F1 Team": "Haas",
};

const MATCH_WINDOW_MS = 12 * 3_600_000;

/** The OpenF1 session of this kind starting near `start` (our schedule's start time). */
export function openf1SessionKey(sessions: unknown, kind: ResultKind, start: Date): number | null {
  if (!Array.isArray(sessions)) return null;
  for (const s of sessions as unknown[]) {
    if (!isRecord(s) || s["session_name"] !== SESSION_NAME[kind]) continue;
    const key = s["session_key"];
    const begins = Date.parse(String(s["date_start"]));
    if (typeof key === "number" && Math.abs(begins - start.getTime()) < MATCH_WINDOW_MS) return key;
  }
  return null;
}

/** Driver number → surname and (short) team name. */
function driversByNumber(drivers: unknown): Map<number, { name: string; team: string }> {
  const byNumber = new Map<number, { name: string; team: string }>();
  for (const d of Array.isArray(drivers) ? (drivers as unknown[]) : []) {
    if (!isRecord(d) || typeof d["driver_number"] !== "number") continue;
    const team = asText(d["team_name"]);
    byNumber.set(d["driver_number"], {
      name: asText(d["last_name"]) || asText(d["driver_number"]),
      team: TEAM_ALIAS[team] ?? team,
    });
  }
  return byNumber;
}

const byPosition = (a: Record<string, unknown>, b: Record<string, unknown>): number =>
  (num(a["position"]) ?? Infinity) - (num(b["position"]) ?? Infinity);

/** OpenF1 `session_result` + `drivers` → every row, or null when not published yet. */
export function parseOpenF1(
  kind: ResultKind,
  results: unknown,
  drivers: unknown,
): SessionResult | null {
  if (!Array.isArray(results) || results.length === 0) return null;
  const byNumber = driversByNumber(drivers);
  const classified = (results as unknown[]).filter(isRecord).toSorted(byPosition);
  const racing = kind === "race" || kind === "sprint";
  const segment = lastSegment(classified[0]?.["duration"]);
  const prefix = kind === "sprint-qualifying" ? "SQ" : "Q";
  const rows: ResultRow[] = classified.map((r, i) => {
    const position = num(r["position"]);
    const first = i === 0 && position === 1;
    const driver = byNumber.get(num(r["driver_number"]) ?? -1);
    return {
      pos: position === null ? "–" : String(position),
      id: asText(r["driver_number"]),
      name: driver?.name ?? asText(r["driver_number"]),
      team: driver?.team ?? "",
      time: racing ? raceTime(r, first) : qualifyingTime(r, first, segment, prefix),
    };
  });
  return { rows };
}
