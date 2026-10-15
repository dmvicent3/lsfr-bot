import { describe, expect, test } from "bun:test";
import { channelName, formatCountdown } from "./time.ts";
import type { Session } from "./types.ts";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe("formatCountdown", () => {
  const cases: [number, string][] = [
    [72 * HOUR, "3d"],
    [49 * HOUR, "2d"],
    [48 * HOUR, "48h"],
    [14 * HOUR + 59 * MIN, "14h"],
    [61 * MIN, "1h"],
    [60 * MIN, "60m"],
    [31 * MIN, "40m"],
    [1000, "10m"],
  ];
  for (const [ms, expected] of cases) {
    test(`${ms}ms → ${expected}`, () => expect(formatCountdown(ms)).toBe(expected));
  }
});

const NOW = new Date("2026-03-10T12:00:00Z");

function session(title: string, startOffset: number, length = HOUR): Session {
  const start = new Date(NOW.getTime() + startOffset);
  return {
    series: "f1",
    eventId: "e",
    eventName: "E",
    sessionId: title.toLowerCase(),
    title,
    start,
    end: new Date(start.getTime() + length),
    pingable: true,
  };
}

describe("channelName", () => {
  test("counts down to the next session", () => {
    expect(channelName("f1", [session("Qualifying", 2 * DAY + HOUR)], NOW)).toBe(
      "f1・qualifying-2d",
    );
  });

  test("shows a live session", () => {
    expect(channelName("f1", [session("Sprint Qualification", -10 * MIN)], NOW)).toBe(
      "f1・🔴-sprint-qualification-live",
    );
  });

  test("off-season when everything is past", () => {
    expect(channelName("f1", [session("Race", -3 * DAY)], NOW)).toBe("f1・off-season");
  });

  test("overlapping live sessions pick the earliest start", () => {
    const sessions = [session("Hyperpole", -5 * MIN), session("Qualifying", -20 * MIN)];
    expect(channelName("wec", sessions, NOW)).toBe("wec・🔴-qualifying-live");
  });
});
