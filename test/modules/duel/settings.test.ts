import { Database } from "bun:sqlite";
import { beforeEach, expect, test } from "bun:test";
import { runMigrations } from "../../../src/core/db.ts";
import { coreMigrations } from "../../../src/core/settings.ts";
import { saveDuelTimeZone, duelTimeZone } from "../../../src/modules/duel/settings.ts";

let db: Database;

beforeEach(() => {
  db = new Database(":memory:", { strict: true });
  runMigrations(db, coreMigrations);
});

test("defaults to Lisbon", () => {
  expect(duelTimeZone(db, "g")).toBe("Europe/Lisbon");
});

test("a saved zone is per server", () => {
  expect(saveDuelTimeZone(db, "g", "America/New_York")).toBeNull();
  expect(duelTimeZone(db, "g")).toBe("America/New_York");
  expect(duelTimeZone(db, "h")).toBe("Europe/Lisbon");
});

test("refuses an unknown time zone", () => {
  expect(saveDuelTimeZone(db, "g", "Mars/Base")).toBe("Unknown time zone: Mars/Base.");
  expect(duelTimeZone(db, "g")).toBe("Europe/Lisbon");
});
