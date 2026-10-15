import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { runMigrations } from "./db.ts";
import { coreMigrations, getSetting, setSetting } from "./settings.ts";

test("settings round-trip and overwrite", () => {
  const db = new Database(":memory:");
  runMigrations(db, coreMigrations);
  expect(getSetting(db, "a")).toBeNull();
  setSetting(db, "a", "1");
  setSetting(db, "a", "2");
  expect(getSetting(db, "a")).toBe("2");
});
