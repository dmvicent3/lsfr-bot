import { describe, expect, test } from "bun:test";
import { dateIn, nextMidnight } from "../../src/core/zoned.ts";

describe("dateIn", () => {
  test("23:59 and 00:00 Lisbon fall on different dates", () => {
    expect(dateIn(Date.UTC(2026, 6, 1, 22, 59), "Europe/Lisbon")).toBe("2026-07-01");
    expect(dateIn(Date.UTC(2026, 6, 1, 23, 0), "Europe/Lisbon")).toBe("2026-07-02");
  });

  test("Pacific/Auckland is ahead", () => {
    expect(dateIn(Date.UTC(2026, 9, 28, 12, 0), "Pacific/Auckland")).toBe("2026-10-29");
  });

  test("single-digit months and days are padded", () => {
    expect(dateIn(Date.UTC(2026, 0, 5, 12), "Europe/Lisbon")).toBe("2026-01-05");
  });
});

describe("nextMidnight", () => {
  test("across the October DST end in Lisbon", () => {
    expect(nextMidnight(Date.UTC(2026, 9, 25, 12), "Europe/Lisbon")).toBe(Date.UTC(2026, 9, 26, 0));
  });

  test("from a summer afternoon", () => {
    expect(nextMidnight(Date.UTC(2026, 6, 1, 12), "Europe/Lisbon")).toBe(Date.UTC(2026, 6, 1, 23));
  });

  test("from just after midnight it is the next one", () => {
    expect(nextMidnight(Date.UTC(2026, 6, 1, 23, 1), "Europe/Lisbon")).toBe(
      Date.UTC(2026, 6, 2, 23),
    );
  });
});
