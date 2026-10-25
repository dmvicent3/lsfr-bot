import type { Migration } from "../../../core/types.ts";
import { INIT } from "./schema.ts";

export const motorsportMigrations: Migration[] = [
  INIT,
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
