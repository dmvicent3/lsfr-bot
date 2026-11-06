import { describe, expect, test } from "bun:test";
import {
  isLocked,
  lockPhase,
  openPredictions,
  weekendLock,
} from "../../../../src/modules/motorsport/predictions/lock.ts";
import { NORMAL_WEEKEND, QUALI, RACE, SPRINT, SPRINT_WEEKEND, SQ } from "../testing/fantasy.ts";

const at = (iso: string, lateSwap = false) => ({ now: Date.parse(iso), lateSwap });

test("an F1 weekend locks at its first predictable session", () => {
  expect(weekendLock(SPRINT_WEEKEND)).toEqual(SQ.start);
  expect(weekendLock(NORMAL_WEEKEND)).toEqual(QUALI.start);
  expect(weekendLock({ eventId: "x", eventName: "X", sessions: [] })).toBeNull();
  expect(isLocked(NORMAL_WEEKEND, QUALI.start.getTime() - 1)).toBe(false);
  expect(isLocked(NORMAL_WEEKEND, QUALI.start.getTime())).toBe(true);
});

describe("openPredictions on an F1 weekend", () => {
  test("every predictable session until the lock, practice never", () => {
    expect(openPredictions(SPRINT_WEEKEND, at("2026-10-17T12:00:00Z"))).toEqual([
      SQ,
      SPRINT,
      QUALI,
      RACE,
    ]);
    expect(openPredictions(NORMAL_WEEKEND, at("2026-10-18T20:59:00Z"))).toEqual([QUALI, RACE]);
  });

  test("nothing from the lock on, even sessions still to start", () => {
    expect(openPredictions(SPRINT_WEEKEND, at("2026-10-17T20:30:00Z"))).toEqual([]);
    expect(openPredictions(NORMAL_WEEKEND, at("2026-10-19T10:00:00Z"))).toEqual([]);
  });

  test("Late Swap keeps the race open until it starts", () => {
    expect(openPredictions(SPRINT_WEEKEND, at("2026-10-18T12:00:00Z", true))).toEqual([RACE]);
    expect(openPredictions(SPRINT_WEEKEND, at("2026-10-19T18:59:00Z", true))).toEqual([RACE]);
    expect(openPredictions(SPRINT_WEEKEND, at("2026-10-19T19:00:00Z", true))).toEqual([]);
  });
});

test("lock phase: the weekend lock, then Late Swap's race start", () => {
  expect(lockPhase(SPRINT_WEEKEND, RACE, at("2026-10-17T12:00:00Z").now)).toEqual({
    phase: "weekend",
    at: SQ.start,
  });
  expect(lockPhase(SPRINT_WEEKEND, RACE, at("2026-10-18T12:00:00Z").now)).toEqual({
    phase: "lateswap",
    at: RACE.start,
  });
});

test("other series lock each session at its own start", () => {
  const race = { ...RACE, series: "motogp" as const };
  const sprint = { ...SPRINT, series: "motogp" as const, sessionId: "sprint" };
  const event = { eventId: "e", eventName: "Austin", sessions: [sprint, race] };
  expect(lockPhase(event, race, at("2026-10-17T12:00:00Z").now)).toEqual({
    phase: "session",
    at: race.start,
  });
  expect(openPredictions(event, at("2026-10-18T17:00:00Z"))).toEqual([race]);
});
