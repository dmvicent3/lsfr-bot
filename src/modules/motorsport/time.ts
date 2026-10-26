import type { SeriesKey, Session } from "./types.ts";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const MAX_FALLBACK_LABEL = 12;

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

const LABELS: Record<string, string> = {
  race: "race",
  gp: "race",
  feature: "feature",
  qualifying: "quali",
  qualifying1: "quali",
  qualifying2: "q2",
  "sprint-qualification": "sq",
  "sprint-race": "sprint",
  sprint: "sprint",
};

const CLASSES: Record<string, string> = { hypercar: "hy", lmgt3: "gt3", lmp2: "p2" };

/** Short session label for channel names; the pinned schedule keeps full titles. */
export function shortLabel(sessionId: string, title: string): string {
  const known = LABELS[sessionId];

  if (known) return known;

  if (/^s?ss\d+$/.test(sessionId)) return sessionId;

  const classed = /^(qualifying|hyperpole)-(.+)$/.exec(sessionId);

  if (classed?.[1] && classed[2]) {
    const kind = classed[1] === "qualifying" ? "quali" : "hp";

    return `${kind}-${CLASSES[classed[2]] ?? slugify(classed[2]).slice(0, 4)}`;
  }

  return slugify(title).slice(0, MAX_FALLBACK_LABEL).replace(/-+$/, "");
}

/** Counts down to (or shows live) only sessions that get pings; practice never appears. */
export function channelName(series: SeriesKey, sessions: Session[], now: Date): string {
  const t = now.getTime();
  const byStart = sessions
    .filter((s) => s.pingable)
    .toSorted((a, b) => a.start.getTime() - b.start.getTime());
  const live = byStart.find((s) => s.start.getTime() <= t && t < s.end.getTime());

  if (live) return `${series}・🔴-${shortLabel(live.sessionId, live.title)}-live`;

  const next = byStart.find((s) => s.start.getTime() > t);

  if (next) {
    const label = shortLabel(next.sessionId, next.title);

    return `${series}・${label}-${formatCountdown(next.start.getTime() - t)}`;
  }

  return `${series}・off-season`;
}
