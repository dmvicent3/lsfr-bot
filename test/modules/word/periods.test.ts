import { expect, test } from "bun:test";
import { periodRange } from "../../../src/modules/word/periods.ts";

test("week runs Monday to Sunday across a month end", () => {
  expect(periodRange("week", "2026-10-28")).toEqual({
    from: "2026-10-26",
    to: "2026-11-01",
    label: "this week (26 Oct – 1 Nov)",
  });
  expect(periodRange("week", "2026-11-01").from).toBe("2026-10-26");
  expect(periodRange("week", "2026-11-02").from).toBe("2026-11-02");
});

test("month", () => {
  expect(periodRange("month", "2026-02-14")).toEqual({
    from: "2026-02-01",
    to: "2026-02-28",
    label: "February 2026",
  });
});

test("today", () => {
  expect(periodRange("today", "2026-10-30")).toEqual({
    from: "2026-10-30",
    to: "2026-10-30",
    label: "Word #3",
  });
});

test("all time", () => {
  expect(periodRange("all", "2026-10-30")).toEqual({
    from: "0000-01-01",
    to: "9999-12-31",
    label: "all time",
  });
});
