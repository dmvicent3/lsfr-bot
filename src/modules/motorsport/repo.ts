import type { Database } from "bun:sqlite";
import type { Migration } from "../../core/db.ts";
import { isSeriesKey } from "./series.ts";
import type { SeriesKey, Session } from "./types.ts";
import type { FullPicks, Picks, Prediction } from "./predictions.ts";
import { isResultRows, type ResultKind, type ResultRow } from "./results.ts";
import type { Forecast } from "./weather.ts";

export const motorsportMigrations: Migration[] = [
  {
    id: "motorsport-001-init",
    sql: `
      CREATE TABLE motorsport_followed (
        series TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        role_id TEXT NOT NULL,
        pinned_message_id TEXT NOT NULL,
        pinned_event_id TEXT,
        channel_name TEXT,
        renamed_at INTEGER
      );
      CREATE TABLE motorsport_sessions (
        series TEXT NOT NULL,
        event_id TEXT NOT NULL,
        event_name TEXT NOT NULL,
        session_id TEXT NOT NULL,
        title TEXT NOT NULL,
        start INTEGER NOT NULL,
        end INTEGER NOT NULL,
        pingable INTEGER NOT NULL,
        fetched_at INTEGER NOT NULL,
        PRIMARY KEY (series, event_id, session_id)
      );
      CREATE TABLE motorsport_one_off (
        user_id TEXT NOT NULL,
        series TEXT NOT NULL,
        event_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        PRIMARY KEY (user_id, series, event_id, session_id)
      );
      CREATE TABLE motorsport_sent_pings (
        series TEXT NOT NULL,
        event_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        message_id TEXT,
        delete_at INTEGER NOT NULL,
        PRIMARY KEY (series, event_id, session_id)
      );
    `,
  },
  {
    id: "motorsport-002-weather",
    sql: `
      CREATE TABLE motorsport_weather (
        series TEXT NOT NULL,
        event_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        temp_c REAL NOT NULL,
        rain_chance INTEGER NOT NULL,
        code INTEGER NOT NULL,
        fetched_at INTEGER NOT NULL,
        PRIMARY KEY (series, event_id, session_id)
      );
    `,
  },
  {
    id: "motorsport-003-results",
    sql: `
      CREATE TABLE motorsport_results (
        series TEXT NOT NULL,
        event_id TEXT NOT NULL,
        event_name TEXT NOT NULL,
        session_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        rows_json TEXT NOT NULL,
        posted_at INTEGER NOT NULL,
        PRIMARY KEY (series, event_id, session_id)
      );
    `,
  },
  {
    id: "motorsport-004-predictions",
    sql: `
      CREATE TABLE motorsport_predictions (
        series TEXT NOT NULL,
        event_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        p1 TEXT,
        p2 TEXT,
        p3 TEXT,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (series, event_id, session_id, user_id)
      );
    `,
  },
  {
    id: "motorsport-005-threads-rulings",
    sql: `
      CREATE TABLE motorsport_threads (
        series TEXT NOT NULL,
        event_id TEXT NOT NULL,
        thread_id TEXT NOT NULL,
        PRIMARY KEY (series, event_id)
      );
      CREATE TABLE motorsport_rulings (
        url TEXT PRIMARY KEY,
        series TEXT NOT NULL,
        event_id TEXT NOT NULL,
        posted INTEGER NOT NULL,
        handled_at INTEGER NOT NULL
      );
    `,
  },
];

interface PicksRow {
  user_id: string;
  p1: string | null;
  p2: string | null;
  p3: string | null;
}

const picksOf = (r: PicksRow): Picks => [r.p1, r.p2, r.p3];

const COMPLETE = "p1 IS NOT NULL AND p2 IS NOT NULL AND p3 IS NOT NULL";

/** A session's classification, kept once posted (also the record F4 predictions score against). */
export interface StoredResult {
  series: SeriesKey;
  eventId: string;
  eventName: string;
  sessionId: string;
  kind: ResultKind;
  rows: ResultRow[];
  postedAt: number;
}

export interface Followed {
  series: SeriesKey;
  channelId: string;
  roleId: string;
  pinnedMessageId: string;
  pinnedEventId: string | null;
  channelName: string | null;
  renamedAt: number | null;
}

export interface SentPing {
  series: SeriesKey;
  eventId: string;
  sessionId: string;
  channelId: string;
  /** null = the session was handled but there was nobody to ping. */
  messageId: string | null;
  deleteAt: number;
}

export type DuePing = Omit<SentPing, "messageId" | "deleteAt"> & { messageId: string };

interface FollowedRow {
  series: string;
  channel_id: string;
  role_id: string;
  pinned_message_id: string;
  pinned_event_id: string | null;
  channel_name: string | null;
  renamed_at: number | null;
}

interface SessionRow {
  series: string;
  event_id: string;
  event_name: string;
  session_id: string;
  title: string;
  start: number;
  end: number;
  pingable: number;
}

interface DueRow {
  series: string;
  event_id: string;
  session_id: string;
  channel_id: string;
  message_id: string;
}

function seriesKey(value: string): SeriesKey {
  if (!isSeriesKey(value)) throw new Error(`Unknown series in database: ${value}`);
  return value;
}

function toFollowed(row: FollowedRow): Followed {
  return {
    series: seriesKey(row.series),
    channelId: row.channel_id,
    roleId: row.role_id,
    pinnedMessageId: row.pinned_message_id,
    pinnedEventId: row.pinned_event_id,
    channelName: row.channel_name,
    renamedAt: row.renamed_at,
  };
}

const FOLLOWED_COLUMNS = {
  channelId: "channel_id",
  roleId: "role_id",
  pinnedMessageId: "pinned_message_id",
  pinnedEventId: "pinned_event_id",
  channelName: "channel_name",
  renamedAt: "renamed_at",
} as const satisfies Record<Exclude<keyof Followed, "series">, string>;

type FollowedPatchKey = keyof typeof FOLLOWED_COLUMNS;

function isPatchKey(k: string): k is FollowedPatchKey {
  return k in FOLLOWED_COLUMNS;
}

export class MotorsportRepo {
  constructor(private readonly db: Database) {}

  listFollowed(): Followed[] {
    return this.db
      .query<FollowedRow, []>("SELECT * FROM motorsport_followed ORDER BY series")
      .all()
      .map(toFollowed);
  }

  getFollowed(s: SeriesKey): Followed | null {
    const row = this.db
      .query<FollowedRow, [string]>("SELECT * FROM motorsport_followed WHERE series = ?")
      .get(s);
    return row ? toFollowed(row) : null;
  }

  insertFollowed(f: Followed): void {
    this.db.run(
      `INSERT INTO motorsport_followed
        (series, channel_id, role_id, pinned_message_id, pinned_event_id, channel_name, renamed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        f.series,
        f.channelId,
        f.roleId,
        f.pinnedMessageId,
        f.pinnedEventId,
        f.channelName,
        f.renamedAt,
      ],
    );
  }

  updateFollowed(s: SeriesKey, patch: Partial<Omit<Followed, "series">>): void {
    const keys = Object.keys(patch).filter(isPatchKey);
    if (keys.length === 0) return;
    const set = keys.map((k) => `${FOLLOWED_COLUMNS[k]} = ?`).join(", ");
    const values = keys.map((k) => patch[k] ?? null);
    this.db.run(`UPDATE motorsport_followed SET ${set} WHERE series = ?`, [...values, s]);
  }

  deleteSeries(s: SeriesKey): void {
    this.db.transaction(() => {
      this.db.run("DELETE FROM motorsport_followed WHERE series = ?", [s]);
      this.db.run("DELETE FROM motorsport_one_off WHERE series = ?", [s]);
      // Keep the sent markers (a re-follow must not re-ping); the messages went with the channel.
      this.db.run("UPDATE motorsport_sent_pings SET message_id = NULL WHERE series = ?", [s]);
    })();
  }

  replaceSessions(s: SeriesKey, sessions: Session[], fetchedAt: number): void {
    const insert = this.db.prepare(
      `INSERT OR REPLACE INTO motorsport_sessions
        (series, event_id, event_name, session_id, title, start, end, pingable, fetched_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    this.db.transaction(() => {
      this.db.run("DELETE FROM motorsport_sessions WHERE series = ?", [s]);
      for (const x of sessions) {
        insert.run(
          s,
          x.eventId,
          x.eventName,
          x.sessionId,
          x.title,
          x.start.getTime(),
          x.end.getTime(),
          x.pingable ? 1 : 0,
          fetchedAt,
        );
      }
    })();
  }

  listSessions(s: SeriesKey): Session[] {
    return this.db
      .query<SessionRow, [string]>(
        "SELECT * FROM motorsport_sessions WHERE series = ? ORDER BY start, session_id",
      )
      .all(s)
      .map((row) => ({
        series: seriesKey(row.series),
        eventId: row.event_id,
        eventName: row.event_name,
        sessionId: row.session_id,
        title: row.title,
        start: new Date(row.start),
        end: new Date(row.end),
        pingable: row.pingable === 1,
      }));
  }

  /** Returns true when the reminder is now set, false when it was removed. */
  toggleOneOff(userId: string, s: SeriesKey, eventId: string, sessionId: string): boolean {
    const params = [userId, s, eventId, sessionId];
    const removed = this.db.run(
      "DELETE FROM motorsport_one_off WHERE user_id = ? AND series = ? AND event_id = ? AND session_id = ?",
      params,
    );
    if (removed.changes > 0) return false;
    this.db.run(
      "INSERT INTO motorsport_one_off (user_id, series, event_id, session_id) VALUES (?, ?, ?, ?)",
      params,
    );
    return true;
  }

  oneOffUsers(s: SeriesKey, eventId: string, sessionId: string): string[] {
    return this.db
      .query<{ user_id: string }, [string, string, string]>(
        "SELECT user_id FROM motorsport_one_off WHERE series = ? AND event_id = ? AND session_id = ? ORDER BY user_id",
      )
      .all(s, eventId, sessionId)
      .map((row) => row.user_id);
  }

  userOneOffs(userId: string, s: SeriesKey, eventId: string): string[] {
    return this.db
      .query<{ session_id: string }, [string, string, string]>(
        "SELECT session_id FROM motorsport_one_off WHERE user_id = ? AND series = ? AND event_id = ? ORDER BY session_id",
      )
      .all(userId, s, eventId)
      .map((row) => row.session_id);
  }

  /** Replaces the user's one-off reminders for one event with exactly `sessionIds`. */
  setOneOffs(userId: string, s: SeriesKey, eventId: string, sessionIds: string[]): void {
    this.db.transaction(() => {
      this.db.run(
        "DELETE FROM motorsport_one_off WHERE user_id = ? AND series = ? AND event_id = ?",
        [userId, s, eventId],
      );
      for (const sessionId of sessionIds) {
        this.db.run(
          "INSERT INTO motorsport_one_off (user_id, series, event_id, session_id) VALUES (?, ?, ?, ?)",
          [userId, s, eventId, sessionId],
        );
      }
    })();
  }

  clearOneOff(s: SeriesKey, eventId: string, sessionId: string): void {
    this.db.run(
      "DELETE FROM motorsport_one_off WHERE series = ? AND event_id = ? AND session_id = ?",
      [s, eventId, sessionId],
    );
  }

  sentKeys(s: SeriesKey): Set<string> {
    const rows = this.db
      .query<{ event_id: string; session_id: string }, [string]>(
        "SELECT event_id, session_id FROM motorsport_sent_pings WHERE series = ?",
      )
      .all(s);
    return new Set(rows.map((row) => `${row.event_id}/${row.session_id}`));
  }

  insertSentPing(p: SentPing): void {
    this.db.run(
      `INSERT OR IGNORE INTO motorsport_sent_pings
        (series, event_id, session_id, channel_id, message_id, delete_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [p.series, p.eventId, p.sessionId, p.channelId, p.messageId, p.deleteAt],
    );
  }

  duePingDeletes(now: number): DuePing[] {
    return this.db
      .query<DueRow, [number]>(
        `SELECT series, event_id, session_id, channel_id, message_id FROM motorsport_sent_pings
         WHERE message_id IS NOT NULL AND delete_at <= ?`,
      )
      .all(now)
      .map((row) => ({
        series: seriesKey(row.series),
        eventId: row.event_id,
        sessionId: row.session_id,
        channelId: row.channel_id,
        messageId: row.message_id,
      }));
  }

  markPingDeleted(s: SeriesKey, eventId: string, sessionId: string): void {
    this.db.run(
      "UPDATE motorsport_sent_pings SET message_id = NULL WHERE series = ? AND event_id = ? AND session_id = ?",
      [s, eventId, sessionId],
    );
  }

  replaceWeather(
    s: SeriesKey,
    rows: { eventId: string; sessionId: string; forecast: Forecast }[],
    fetchedAt: number,
  ): void {
    this.db.transaction(() => {
      this.db.run("DELETE FROM motorsport_weather WHERE series = ?", [s]);
      for (const { eventId, sessionId, forecast } of rows) {
        this.db.run(
          `INSERT OR REPLACE INTO motorsport_weather
            (series, event_id, session_id, temp_c, rain_chance, code, fetched_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [s, eventId, sessionId, forecast.tempC, forecast.rainChance, forecast.code, fetchedAt],
        );
      }
    })();
  }

  /** Forecasts keyed by `eventId/sessionId`. */
  weatherFor(s: SeriesKey): Map<string, Forecast> {
    const rows = this.db
      .query<
        { event_id: string; session_id: string; temp_c: number; rain_chance: number; code: number },
        [string]
      >(
        "SELECT event_id, session_id, temp_c, rain_chance, code FROM motorsport_weather WHERE series = ?",
      )
      .all(s);
    return new Map(
      rows.map((r) => [
        `${r.event_id}/${r.session_id}`,
        { tempC: r.temp_c, rainChance: r.rain_chance, code: r.code },
      ]),
    );
  }

  insertResult(r: StoredResult): void {
    this.db.run(
      `INSERT OR REPLACE INTO motorsport_results
        (series, event_id, event_name, session_id, kind, rows_json, posted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [r.series, r.eventId, r.eventName, r.sessionId, r.kind, JSON.stringify(r.rows), r.postedAt],
    );
  }

  /** `eventId/sessionId` of every stored result. */
  resultKeys(s: SeriesKey): Set<string> {
    const rows = this.db
      .query<{ key: string }, [string]>(
        "SELECT event_id || '/' || session_id AS key FROM motorsport_results WHERE series = ?",
      )
      .all(s);
    return new Set(rows.map((r) => r.key));
  }

  latestResult(s: SeriesKey): StoredResult | null {
    const row = this.db
      .query<
        {
          event_id: string;
          event_name: string;
          session_id: string;
          kind: ResultKind;
          rows_json: string;
          posted_at: number;
        },
        [string]
      >(
        `SELECT event_id, event_name, session_id, kind, rows_json, posted_at
         FROM motorsport_results WHERE series = ? ORDER BY posted_at DESC LIMIT 1`,
      )
      .get(s);
    if (!row) return null;
    const rows: unknown = JSON.parse(row.rows_json);
    return {
      series: s,
      eventId: row.event_id,
      eventName: row.event_name,
      sessionId: row.session_id,
      kind: row.kind,
      rows: isResultRows(rows) ? rows : [],
      postedAt: row.posted_at,
    };
  }

  getPicks(userId: string, s: SeriesKey, eventId: string, sessionId: string): Picks {
    const row = this.db
      .query<PicksRow, [string, string, string, string]>(
        `SELECT user_id, p1, p2, p3 FROM motorsport_predictions
         WHERE series = ? AND event_id = ? AND session_id = ? AND user_id = ?`,
      )
      .get(s, eventId, sessionId, userId);
    return row ? picksOf(row) : [null, null, null];
  }

  setPicks(
    userId: string,
    s: SeriesKey,
    eventId: string,
    sessionId: string,
    picks: Picks,
    now: number,
  ): void {
    this.db.run(
      `INSERT OR REPLACE INTO motorsport_predictions
        (series, event_id, session_id, user_id, p1, p2, p3, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [s, eventId, sessionId, userId, ...picks, now],
    );
  }

  /** Predictions with all three positions picked. */
  completePredictions(s: SeriesKey, eventId: string, sessionId: string): Prediction[] {
    return this.db
      .query<PicksRow & { p1: string; p2: string; p3: string }, [string, string, string]>(
        `SELECT user_id, p1, p2, p3 FROM motorsport_predictions
         WHERE series = ? AND event_id = ? AND session_id = ? AND ${COMPLETE}
         ORDER BY updated_at`,
      )
      .all(s, eventId, sessionId)
      .map((r) => ({ userId: r.user_id, picks: [r.p1, r.p2, r.p3] }));
  }

  /** Complete predictions per session of one event. */
  predictionCounts(s: SeriesKey, eventId: string): Map<string, number> {
    const rows = this.db
      .query<{ session_id: string; n: number }, [string, string]>(
        `SELECT session_id, COUNT(*) AS n FROM motorsport_predictions
         WHERE series = ? AND event_id = ? AND ${COMPLETE} GROUP BY session_id`,
      )
      .all(s, eventId);
    return new Map(rows.map((r) => [r.session_id, r.n]));
  }

  /** Every complete race/sprint prediction whose result was posted at or after `since`. */
  seasonPredictions(
    s: SeriesKey,
    since: number,
  ): { userId: string; picks: FullPicks; rows: ResultRow[] }[] {
    return this.db
      .query<
        { user_id: string; p1: string; p2: string; p3: string; rows_json: string },
        [string, number]
      >(
        `SELECT p.user_id, p.p1, p.p2, p.p3, r.rows_json
         FROM motorsport_predictions p
         JOIN motorsport_results r USING (series, event_id, session_id)
         WHERE p.series = ? AND r.posted_at >= ? AND r.kind IN ('race', 'sprint')
           AND ${COMPLETE}
         ORDER BY r.posted_at, p.user_id`,
      )
      .all(s, since)
      .map((r) => {
        const rows: unknown = JSON.parse(r.rows_json);
        return {
          userId: r.user_id,
          picks: [r.p1, r.p2, r.p3],
          rows: isResultRows(rows) ? rows : [],
        };
      });
  }

  /** The weekend's results thread. */
  getThread(s: SeriesKey, eventId: string): string | null {
    const row = this.db
      .query<{ thread_id: string }, [string, string]>(
        "SELECT thread_id FROM motorsport_threads WHERE series = ? AND event_id = ?",
      )
      .get(s, eventId);
    return row?.thread_id ?? null;
  }

  setThread(s: SeriesKey, eventId: string, threadId: string): void {
    this.db.run(
      "INSERT OR REPLACE INTO motorsport_threads (series, event_id, thread_id) VALUES (?, ?, ?)",
      [s, eventId, threadId],
    );
  }

  /** A ruling document dealt with: posted, or looked at and not for posting. */
  markRuling(s: SeriesKey, eventId: string, url: string, posted: boolean, now: number): void {
    this.db.run(
      `INSERT OR REPLACE INTO motorsport_rulings (url, series, event_id, posted, handled_at)
       VALUES (?, ?, ?, ?, ?)`,
      [url, s, eventId, posted ? 1 : 0, now],
    );
  }

  handledRulings(s: SeriesKey): Set<string> {
    const rows = this.db
      .query<{ url: string }, [string]>("SELECT url FROM motorsport_rulings WHERE series = ?")
      .all(s);
    return new Set(rows.map((r) => r.url));
  }
}
