import { Database } from "bun:sqlite";
import { beforeEach, expect, test } from "bun:test";
import { runMigrations } from "../../../src/core/db.ts";
import { coreMigrations } from "../../../src/core/settings.ts";
import { FIRST_PUZZLE, periodRange } from "../../../src/modules/grid/periods.ts";
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

test("periods are labelled with the puzzle number", () => {
  expect(FIRST_PUZZLE).toBe("2026-11-03");
  expect(periodRange("today", "2026-11-05")).toEqual({
    from: "2026-11-05",
    to: "2026-11-05",
    label: "Country grid #3",
  });
  expect(periodRange("week", "2026-11-05").from).toBe("2026-11-02");
});
