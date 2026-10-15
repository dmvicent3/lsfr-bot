import { isRecord, isString } from "../../core/guards.ts";
import { isSeriesKey, type SeriesInfo } from "./series.ts";
import type { SeriesKey, Session } from "./types.ts";

export type ResultKind = "qualifying" | "sprint-qualifying" | "sprint" | "race";

export interface ResultRow {
  /** "1".."20", or "–" for an unclassified finisher. */
  pos: string;
  name: string;
  team: string;
  /** Winner's time, a gap ("+3.123", "+1 lap"), a lap time, or "DNF". */
  time: string;
}

export interface SessionResult {
  rows: ResultRow[];
}

export function isResultRows(value: unknown): value is ResultRow[] {
  return (
    Array.isArray(value) &&
    (value as unknown[]).every(
      (r) =>
        isRecord(r) &&
        isString(r["pos"]) &&
        isString(r["name"]) &&
        isString(r["team"]) &&
        isString(r["time"]),
    )
  );
}

/** Results are looked for this long after a session ends, then given up on. */
export const RESULTS_WINDOW_MS = 6 * 3_600_000;

export const lapsDown = (n: number): string => `+${n} lap${n === 1 ? "" : "s"}`;

const RESULT_SESSIONS: Partial<Record<SeriesKey, Record<string, ResultKind>>> = {
  f1: {
    qualifying: "qualifying",
    "sprint-qualification": "sprint-qualifying",
    "sprint-race": "sprint",
    race: "race",
  },
  motogp: { qualifying2: "qualifying", sprint: "sprint", race: "race" },
};

const KIND_LABEL: Record<ResultKind, string> = {
  qualifying: "Qualifying",
  "sprint-qualifying": "Sprint Qualifying",
  sprint: "Sprint",
  race: "Race",
};

export function resultKind(series: SeriesKey, sessionId: string): ResultKind | null {
  return RESULT_SESSIONS[series]?.[sessionId] ?? null;
}

export function resultSeries(): SeriesKey[] {
  return Object.keys(RESULT_SESSIONS).filter(isSeriesKey);
}

export const resultKey = (s: Pick<Session, "eventId" | "sessionId">): string =>
  `${s.eventId}/${s.sessionId}`;

/** Result sessions that ended within the window and haven't been posted. */
export function resultsDue(
  sessions: Session[],
  posted: ReadonlySet<string>,
  now: number,
): Session[] {
  return sessions.filter((s) => {
    const end = s.end.getTime();
    return (
      resultKind(s.series, s.sessionId) !== null &&
      end <= now &&
      now < end + RESULTS_WINDOW_MS &&
      !posted.has(resultKey(s))
    );
  });
}

const MAX_NAME = 15;
const MAX_TEAM = 12;
const MAX_CONTENT = 2000;

/**
 * Heading in the clear, then the whole classification as a monospace table (one inline code
 * span per row, so it aligns), behind a single spoiler unless `spoiler` is false.
 */
export function renderResults(
  info: SeriesInfo,
  eventName: string,
  kind: ResultKind,
  result: SessionResult,
  { spoiler = true }: { spoiler?: boolean } = {},
): string {
  const heading = `## 🏁 ${info.name} — ${eventName} · ${KIND_LABEL[kind]} results`;
  if (result.rows.length === 0) return `${heading}\nNo classification published.`;
  const rows = result.rows.map((r) => ({
    pos: /^\d+$/.test(r.pos) ? `P${r.pos}` : r.pos,
    name: r.name.slice(0, MAX_NAME).trim(),
    team: r.team.slice(0, MAX_TEAM).trim(),
    time: r.time,
  }));
  const width = (key: keyof (typeof rows)[number]): number =>
    Math.max(...rows.map((r) => r[key].length));
  const [pos, name, team, time] = [width("pos"), width("name"), width("team"), width("time")];
  const lines = rows.map(
    (r) =>
      `\`${r.pos.padEnd(pos)} ${r.name.padEnd(name)} ${r.team.padEnd(team)} ${r.time.padStart(time)}\``,
  );
  const wrap = spoiler ? "||" : "";
  const render = (shown: string[]): string => `${heading}\n${wrap}${shown.join("\n")}${wrap}`;
  let shown = lines;
  while (render(shown).length > MAX_CONTENT) shown = shown.slice(0, -1);
  return render(shown);
}
