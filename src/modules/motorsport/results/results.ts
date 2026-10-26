import type { ResultHeading, ResultKind, ResultRow, SessionResult } from "./types.ts";
import { isRecord, isString } from "../../../core/guards.ts";
import { isSeriesKey } from "../series.ts";
import { fitName, fitTeam, formatTable, posLabel, tableMessage } from "../format.ts";
import type { SeriesKey, Session } from "../types.ts";

export function isResultRows(value: unknown): value is ResultRow[] {
  return (
    Array.isArray(value) &&
    (value as unknown[]).every(
      (r) =>
        isRecord(r) &&
        isString(r["pos"]) &&
        isString(r["id"]) &&
        isString(r["name"]) &&
        isString(r["team"]) &&
        isString(r["time"]),
    )
  );
}

/** Stored result rows; anything unreadable as none. */
export function parseResultRows(json: string): ResultRow[] {
  const rows: unknown = JSON.parse(json);

  return isResultRows(rows) ? rows : [];
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

/**
 * Heading in the clear, then the whole classification as a monospace table, behind a
 * single spoiler unless `spoiler` is false.
 */
export function renderResults(
  { info, eventName, kind }: ResultHeading,
  result: SessionResult,
  { spoiler = true }: { spoiler?: boolean } = {},
): string {
  const heading = `## 🏁 ${info.name} — ${eventName} · ${KIND_LABEL[kind]} results`;

  if (result.rows.length === 0) return `${heading}\nNo classification published.`;

  const lines = formatTable(
    result.rows.map((r) => [posLabel(r.pos), fitName(r.name), fitTeam(r.team), r.time]),
    new Set([3]),
  );

  return tableMessage(heading, lines, spoiler);
}
