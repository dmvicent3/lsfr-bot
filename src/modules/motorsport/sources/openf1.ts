import { asText, isRecord, isString } from "../../../core/guards.ts";
import { lapsDown, type ResultKind, type ResultRow, type SessionResult } from "../results.ts";

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

/** "1:42:00.785" over an hour, "1:31.156" under. */
export function formatDuration(seconds: number): string {
  const ms = Math.round(seconds * 1000);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = ((ms % 60_000) / 1000).toFixed(3).padStart(6, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

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

const num = (v: unknown): number | null => (typeof v === "number" ? v : null);

/** Qualifying lists Q1, Q2, Q3: the index of the last segment with a time. */
function lastSegment(durations: unknown): number {
  if (!Array.isArray(durations)) return -1;
  return (durations as unknown[]).findLastIndex((d) => typeof d === "number");
}

function gapText(gap: unknown): string {
  if (typeof gap === "number") return `+${gap.toFixed(3)}`;
  if (!isString(gap)) return "";
  const laps = /^\+(\d+) LAPS?$/.exec(gap);
  return laps ? lapsDown(Number(laps[1])) : gap;
}

function raceTime(r: Record<string, unknown>, first: boolean): string {
  if (r["dsq"] === true) return "DSQ";
  if (r["dns"] === true) return "DNS";
  if (r["dnf"] === true) return "DNF";
  const duration = num(r["duration"]);
  return first && duration !== null ? formatDuration(duration) : gapText(r["gap_to_leader"]);
}

/**
 * Pole's lap in the final segment and everyone else's gap in it. Drivers without a lap
 * there (knocked out earlier, or no lap set) show their own best from the last segment
 * they did set one in, e.g. "Q2 1:32.784".
 */
function qualifyingTime(
  r: Record<string, unknown>,
  first: boolean,
  segment: number,
  prefix: string,
): string {
  if (r["dsq"] === true) return "DSQ";
  const durations = Array.isArray(r["duration"]) ? (r["duration"] as unknown[]) : [];
  const gaps = Array.isArray(r["gap_to_leader"]) ? (r["gap_to_leader"] as unknown[]) : [];
  const lap = num(durations[segment]);
  if (lap !== null) return first ? formatDuration(lap) : gapText(gaps[segment]);
  const own = lastSegment(durations);
  const best = num(durations[own]);
  return best === null ? "no time" : `${prefix}${own + 1} ${formatDuration(best)}`;
}

/** OpenF1 `session_result` + `drivers` → every row, or null when not published yet. */
export function parseOpenF1(
  kind: ResultKind,
  results: unknown,
  drivers: unknown,
): SessionResult | null {
  if (!Array.isArray(results) || results.length === 0) return null;
  const byNumber = new Map<number, { name: string; team: string }>();
  if (Array.isArray(drivers)) {
    for (const d of drivers as unknown[]) {
      if (!isRecord(d) || typeof d["driver_number"] !== "number") continue;
      const team = asText(d["team_name"]);
      byNumber.set(d["driver_number"], {
        name: asText(d["last_name"]) || asText(d["driver_number"]),
        team: TEAM_ALIAS[team] ?? team,
      });
    }
  }
  const classified = (results as unknown[])
    .filter(isRecord)
    .toSorted((a, b) => (num(a["position"]) ?? Infinity) - (num(b["position"]) ?? Infinity));
  const racing = kind === "race" || kind === "sprint";
  const segment = lastSegment(classified[0]?.["duration"]);
  const prefix = kind === "sprint-qualifying" ? "SQ" : "Q";
  const rows: ResultRow[] = classified.map((r, i) => {
    const position = num(r["position"]);
    const first = i === 0 && position === 1;
    const driver = byNumber.get(num(r["driver_number"]) ?? -1);
    return {
      pos: position === null ? "–" : String(position),
      name: driver?.name ?? asText(r["driver_number"]),
      team: driver?.team ?? "",
      time: racing ? raceTime(r, first) : qualifyingTime(r, first, segment, prefix),
    };
  });
  return { rows };
}
