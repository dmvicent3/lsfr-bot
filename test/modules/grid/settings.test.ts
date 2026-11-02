import { Database } from "bun:sqlite";
import { beforeEach, expect, test } from "bun:test";
import { runMigrations } from "../../../src/core/db.ts";
import { coreMigrations } from "../../../src/core/settings.ts";
import { gridTimeZone, saveGridTimeZone } from "../../../src/modules/grid/settings.ts";

let db: Database;

beforeEach(() => {
  db = new Database(":memory:", { strict: true });
  runMigrations(db, coreMigrations);
});

test("zone defaults to Lisbon, is per server, and refuses unknown zones", () => {
  expect(gridTimeZone(db, "g")).toBe("Europe/Lisbon");
  expect(saveGridTimeZone(db, "g", "America/New_York")).toBeNull();
  expect(gridTimeZone(db, "g")).toBe("America/New_York");
  expect(gridTimeZone(db, "h")).toBe("Europe/Lisbon");
  expect(saveGridTimeZone(db, "g", "Mars/Base")).toBe("Unknown time zone: Mars/Base.");
});
