import { expect, test } from "bun:test";
import { ALL_TIME, monthRange, rangeInstants, weekRange } from "../../src/core/periods.ts";

test("week runs Monday to Sunday across a month end", () => {
  expect(weekRange("2026-10-28")).toEqual({
    from: "2026-10-26",
    to: "2026-11-01",
    label: "this week (26 Oct – 1 Nov)",
  });
  expect(weekRange("2026-11-01").from).toBe("2026-10-26");
  expect(weekRange("2026-11-02").from).toBe("2026-11-02");
});

test("month", () => {
  expect(monthRange("2026-02-14")).toEqual({
    from: "2026-02-01",
    to: "2026-02-28",
    label: "February 2026",
  });
});

test("all time", () => {
  expect(ALL_TIME).toEqual({ from: "0000-01-01", to: "9999-12-31", label: "all time" });
});

test("instants cover the zone's day, 25 h when DST ends", () => {
  const range = { from: "2026-10-25", to: "2026-10-25", label: "" };

  expect(rangeInstants(range, "Europe/Lisbon")).toEqual({
    from: Date.UTC(2026, 9, 24, 23),
    to: Date.UTC(2026, 9, 26, 0),
  });
});

test("all time instants span everything stored", () => {
  const { from, to } = rangeInstants(ALL_TIME, "Europe/Lisbon");

  expect(from).toBeLessThan(0);
  expect(to).toBeGreaterThan(Date.UTC(3000, 0, 1));
});
