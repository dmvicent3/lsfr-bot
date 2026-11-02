import { Database } from "bun:sqlite";
import { beforeEach, expect, test } from "bun:test";
import { runMigrations } from "../../../src/core/db.ts";
import { coreMigrations } from "../../../src/core/settings.ts";
import { saveSudokuTimeZone, sudokuTimeZone } from "../../../src/modules/sudoku/settings.ts";

let db: Database;

beforeEach(() => {
  db = new Database(":memory:", { strict: true });
  runMigrations(db, coreMigrations);
});

test("defaults to Lisbon", () => {
  expect(sudokuTimeZone(db, "g")).toBe("Europe/Lisbon");
});

test("a saved zone is per server", () => {
  expect(saveSudokuTimeZone(db, "g", "America/New_York")).toBeNull();
  expect(sudokuTimeZone(db, "g")).toBe("America/New_York");
  expect(sudokuTimeZone(db, "h")).toBe("Europe/Lisbon");
});

test("refuses an unknown time zone", () => {
  expect(saveSudokuTimeZone(db, "g", "Mars/Base")).toBe("Unknown time zone: Mars/Base.");
  expect(sudokuTimeZone(db, "g")).toBe("Europe/Lisbon");
});
