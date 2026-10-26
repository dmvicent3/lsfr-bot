import { Database } from "bun:sqlite";
import { runMigrations } from "../../../../src/core/db.ts";
import { MangaRepo } from "../../../../src/modules/manga/store/repo.ts";
import { mangaMigrations } from "../../../../src/modules/manga/store/migrations.ts";
import type { Series } from "../../../../src/modules/manga/store/types.ts";

export function freshRepo(): MangaRepo {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, mangaMigrations);

  return new MangaRepo(db);
}

export function series(over: Partial<Series> = {}): Series {
  return {
    id: "m1",
    title: "Frieren",
    highest: 10,
    latestUpload: "c10",
    checkedAt: 1000,
    ...over,
  };
}
