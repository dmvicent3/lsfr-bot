import { isString } from "../../../core/guards.ts";
import { lapsDown } from "./results.ts";

/** "1:42:00.785" over an hour, "1:31.156" under. */
export function formatDuration(seconds: number): string {
  const ms = Math.round(seconds * 1000);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = ((ms % 60_000) / 1000).toFixed(3).padStart(6, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

export const num = (v: unknown): number | null => (typeof v === "number" ? v : null);

/** Qualifying lists Q1, Q2, Q3: the index of the last segment with a time. */
export function lastSegment(durations: unknown): number {
  if (!Array.isArray(durations)) return -1;
  return (durations as unknown[]).findLastIndex((d) => typeof d === "number");
}

function gapText(gap: unknown): string {
  if (typeof gap === "number") return `+${gap.toFixed(3)}`;
  if (!isString(gap)) return "";
  const laps = /^\+(\d+) LAPS?$/.exec(gap);
  return laps ? lapsDown(Number(laps[1])) : gap;
}

export function raceTime(r: Record<string, unknown>, first: boolean): string {
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
export function qualifyingTime(
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
