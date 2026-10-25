import type { Migration } from "./types.ts";
import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export function openDatabase(path: string): Database {
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path, { create: true, strict: true });
  db.run("PRAGMA journal_mode = WAL");
  return db;
}

export function runMigrations(db: Database, migrations: Migration[]): void {
  db.run(
    "CREATE TABLE IF NOT EXISTS migrations (id TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)",
  );
  const applied = new Set(
    db
      .query<{ id: string }, []>("SELECT id FROM migrations")
      .all()
      .map((row) => row.id),
  );
  for (const migration of migrations) {
    if (applied.has(migration.id)) continue;
    db.transaction(() => {
      db.run(migration.sql);
      db.run("INSERT INTO migrations (id, applied_at) VALUES (?, ?)", [migration.id, Date.now()]);
    })();
  }
}
