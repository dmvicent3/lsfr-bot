import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { runMigrations } from "../../../core/db.ts";
import { coreMigrations } from "../../../core/settings.ts";
import { formatLead, getLeadMinutes, parseLeadTime } from "./lead.ts";

describe("parseLeadTime", () => {
  const cases: [string, number | null][] = [
    ["30m", 30],
    ["1h", 60],
    ["1h30m", 90],
    [" 90M ", 90],
    ["4m", null],
    ["25h", null],
    ["abc", null],
  ];
  for (const [input, expected] of cases) {
    test(JSON.stringify(input), () => expect(parseLeadTime(input)).toBe(expected));
  }
});

test("formatLead", () => {
  expect(formatLead(90)).toBe("1h 30m");
  expect(formatLead(60)).toBe("1h");
  expect(formatLead(30)).toBe("30m");
});

test("getLeadMinutes defaults to 60", () => {
  const db = new Database(":memory:");
  runMigrations(db, coreMigrations);
  expect(getLeadMinutes(db)).toBe(60);
});
