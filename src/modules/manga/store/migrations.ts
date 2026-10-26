import type { Migration } from "../../../core/types.ts";

export const mangaMigrations: Migration[] = [
  {
    id: "manga-001-init",
    sql: `
      CREATE TABLE manga_series (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        highest REAL,
        latest_upload TEXT,
        checked_at INTEGER NOT NULL
      );
      CREATE TABLE manga_follows (
        manga_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        PRIMARY KEY (manga_id, user_id)
      );
      CREATE INDEX manga_follows_user ON manga_follows (user_id);
      CREATE TABLE manga_unnumbered (
        chapter_id TEXT PRIMARY KEY,
        posted_at INTEGER NOT NULL
      );
    `,
  },
];
