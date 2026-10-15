import type { Database } from "bun:sqlite";
import type { Migration } from "./db.ts";

export const coreMigrations: Migration[] = [
  {
    id: "core-001-settings",
    sql: "CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
  },
];

export function getSetting(db: Database, key: string): string | null {
  return (
    db.query<{ value: string }, [string]>("SELECT value FROM settings WHERE key = ?").get(key)
      ?.value ?? null
  );
}

export function setSetting(db: Database, key: string, value: string): void {
  db.run(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value",
    [key, value],
  );
}
