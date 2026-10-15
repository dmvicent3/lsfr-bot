import type { SeriesKey, Session } from "./types.ts";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export function formatCountdown(ms: number): string {
  if (ms > 48 * HOUR) return `${Math.floor(ms / DAY)}d`;
  if (ms > HOUR) return `${Math.floor(ms / HOUR)}h`;
  return `${Math.ceil(ms / (10 * MIN)) * 10}m`;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}

/** Counts down to (or shows live) only sessions that get pings; practice never appears. */
export function channelName(series: SeriesKey, sessions: Session[], now: Date): string {
  const t = now.getTime();
  const byStart = sessions
    .filter((s) => s.pingable)
    .toSorted((a, b) => a.start.getTime() - b.start.getTime());
  const live = byStart.find((s) => s.start.getTime() <= t && t < s.end.getTime());
  if (live) return `${series}・🔴-${slugify(live.title)}-live`;
  const next = byStart.find((s) => s.start.getTime() > t);
  if (next) return `${series}・${slugify(next.title)}-${formatCountdown(next.start.getTime() - t)}`;
  return `${series}・off-season`;
}
