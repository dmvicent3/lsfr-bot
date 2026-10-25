import { describe, expect, test } from "bun:test";
import { channelName, formatCountdown, shortLabel } from "../../../src/modules/motorsport/time.ts";
import type { Session } from "../../../src/modules/motorsport/types.ts";

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
    expect(channelName("f1", [session("Qualifying", 2 * DAY + HOUR)], NOW)).toBe("f1・quali-2d");
  });

  test("shows a live session", () => {
    const sq = { ...session("Sprint Qualification", -10 * MIN), sessionId: "sprint-qualification" };
    expect(channelName("f1", [sq], NOW)).toBe("f1・🔴-sq-live");
  });

  test("off-season when everything is past", () => {
    expect(channelName("f1", [session("Race", -3 * DAY)], NOW)).toBe("f1・off-season");
  });

  test("overlapping live sessions pick the earliest start", () => {
    const sessions = [session("Hyperpole", -5 * MIN), session("Qualifying", -20 * MIN)];
    expect(channelName("wec", sessions, NOW)).toBe("wec・🔴-quali-live");
  });
});

describe("channelName ignores sessions without pings", () => {
  test("counts down past practice to the next pinged session", () => {
    const fp = { ...session("Practice 1", HOUR), pingable: false };
    expect(channelName("f1", [fp, session("Qualifying", 2 * DAY + HOUR)], NOW)).toBe(
      "f1・quali-2d",
    );
  });

  test("a live practice session is not shown as live", () => {
    const fp = { ...session("Practice 1", -10 * MIN), pingable: false };
    expect(channelName("f1", [fp, session("Race", 3 * HOUR)], NOW)).toBe("f1・race-3h");
  });
});

describe("shortLabel", () => {
  const cases: [string, string, string][] = [
    ["race", "Race", "race"],
    ["gp", "Race", "race"],
    ["feature", "Feature Race", "feature"],
    ["qualifying", "Qualifying", "quali"],
    ["qualifying1", "Qualifying", "quali"],
    ["qualifying2", "Qualifying 2", "q2"],
    ["sprint-qualification", "Sprint Qualification", "sq"],
    ["sprint-race", "Sprint Race", "sprint"],
    ["sprint", "Sprint", "sprint"],
    ["qualifying-hypercar", "Qualifying - HYPERCAR", "quali-hy"],
    ["hyperpole-lmgt3", "Hyperpole - LMGT3", "hp-gt3"],
    ["hyperpole-lmp2", "Hyperpole - LMP2", "hp-p2"],
    ["ss1", "SS1 Toudon / Saint-Antonin", "ss1"],
    ["sss12", "SSS12 Monaco", "sss12"],
    ["mystery", "Some Very Long Session Title", "some-very-lo"],
  ];
  for (const [sessionId, title, expected] of cases) {
    test(`${sessionId} → ${expected}`, () => expect(shortLabel(sessionId, title)).toBe(expected));
  }
});

test("channel names use short labels", () => {
  const sq = { ...session("Sprint Qualification", 40 * MIN), sessionId: "sprint-qualification" };
  expect(channelName("f1", [sq], NOW)).toBe("f1・sq-40m");
});
