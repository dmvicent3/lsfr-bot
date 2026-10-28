import { Database } from "bun:sqlite";
import { beforeEach, expect, test } from "bun:test";
import { runMigrations } from "../../../src/core/db.ts";
import { coreMigrations } from "../../../src/core/settings.ts";
import { isTimeZone, saveWordSettings, wordSettings } from "../../../src/modules/word/settings.ts";

let db: Database;

beforeEach(() => {
  db = new Database(":memory:", { strict: true });
  runMigrations(db, coreMigrations);
});

test("defaults", () => {
  expect(wordSettings(db, "g")).toEqual({ length: 5, timeZone: "Europe/Lisbon" });
});

test("saved settings are per server", () => {
  expect(saveWordSettings(db, "g", { length: 6, timeZone: "America/New_York" })).toBeNull();
  expect(wordSettings(db, "g")).toEqual({ length: 6, timeZone: "America/New_York" });
  expect(wordSettings(db, "h").length).toBe(5);
});

test("one setting changes alone", () => {
  saveWordSettings(db, "g", { length: 7 });
  expect(wordSettings(db, "g")).toEqual({ length: 7, timeZone: "Europe/Lisbon" });
});

test("bad values are refused and nothing is saved", () => {
  expect(saveWordSettings(db, "g", { length: 9 })).toBe("Lengths are 4 to 7.");
  expect(saveWordSettings(db, "g", { length: 6, timeZone: "Mars/Base" })).toBe(
    "Unknown time zone: Mars/Base.",
  );
  expect(wordSettings(db, "g").length).toBe(5);
});

test("isTimeZone", () => {
  expect(isTimeZone("Asia/Tokyo")).toBe(true);
  expect(isTimeZone("Mars/Base")).toBe(false);
});
