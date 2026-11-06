import { describe, expect, test } from "bun:test";
import {
  nextWeekStart,
  pollHours,
  pollsDue,
  weekOf,
} from "../../../../src/modules/gacha/banner/week.ts";

const LISBON = "Europe/Lisbon";
const at = (iso: string): number => Date.parse(iso);

describe("weekOf", () => {
  test("Monday 00:00 to Monday 00:00 in the server's zone", () => {
    // Friday 6 Nov 2026, Lisbon on UTC (winter time).
    const w = weekOf(at("2026-11-06T15:00:00Z"), LISBON);

    expect(w.start).toBe("2026-11-02");
    expect(w.startsAt).toBe(at("2026-11-02T00:00:00Z"));
    expect(w.endsAt).toBe(at("2026-11-09T00:00:00Z"));
    expect(w.pollsAt).toBe(at("2026-11-05T12:00:00Z"));
  });

  test("Sunday late at night is still the same week; Monday midnight is the next", () => {
    expect(weekOf(at("2026-11-08T23:59:00Z"), LISBON).start).toBe("2026-11-02");
    expect(weekOf(at("2026-11-09T00:00:00Z"), LISBON).start).toBe("2026-11-09");
  });

  test("follows the zone, not UTC", () => {
    // 23:30 UTC Sunday is already Monday 08:30 in Tokyo.
    const w = weekOf(at("2026-11-08T23:30:00Z"), "Asia/Tokyo");

    expect(w.start).toBe("2026-11-09");
    expect(w.startsAt).toBe(at("2026-11-08T15:00:00Z"));
  });

  test("a week across the DST change is 169 hours long", () => {
    const w = weekOf(at("2026-10-20T12:00:00Z"), LISBON);

    expect(w.start).toBe("2026-10-19");
    expect((w.endsAt - w.startsAt) / 3_600_000).toBe(169);
  });
});

describe("nextWeekStart", () => {
  test("seven days on", () => {
    expect(nextWeekStart("2026-12-28")).toBe("2027-01-04");
  });
});

describe("polls", () => {
  const w = weekOf(at("2026-11-06T15:00:00Z"), LISBON);

  test("run until an hour before the reset", () => {
    expect(pollHours(at("2026-11-05T12:00:00Z"), w)).toBe(83);
    expect(pollHours(at("2026-11-05T12:20:00Z"), w)).toBe(82);
  });

  test("are not due before Thursday noon or with under an hour left", () => {
    expect(pollsDue(at("2026-11-05T11:59:00Z"), w)).toBe(false);
    expect(pollsDue(at("2026-11-05T12:00:00Z"), w)).toBe(true);
    expect(pollsDue(at("2026-11-08T22:30:00Z"), w)).toBe(false);
  });
});
