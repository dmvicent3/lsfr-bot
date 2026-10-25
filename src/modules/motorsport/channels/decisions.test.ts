import { describe, expect, test } from "bun:test";
import {
  currentEvent,
  groupEvents,
  RENAME_MIN_INTERVAL_MS,
  sessionKey,
  sessionsToPing,
  shouldDeleteMessage,
  shouldRename,
  withoutPinged,
} from "./decisions.ts";
import type { Session } from "../types.ts";

const MIN = 60_000;
const T = Date.parse("2026-03-10T12:00:00Z");

function session(
  over: Partial<Omit<Session, "start" | "end">> & { start: number; end?: number },
): Session {
  return {
    series: "f1",
    eventId: "e",
    eventName: "E",
    sessionId: "race",
    title: "Race",
    pingable: true,
    ...over,
    start: new Date(over.start),
    end: new Date(over.end ?? over.start + 60 * MIN),
  };
}

describe("shouldRename", () => {
  test("not when the name is unchanged", () => {
    expect(shouldRename("a", "a", null, T)).toBe(false);
  });
  test("yes when never renamed", () => {
    expect(shouldRename("a", "b", null, T)).toBe(true);
  });
  test("throttled for 5 minutes after a rename", () => {
    expect(shouldRename("a", "b", T - (RENAME_MIN_INTERVAL_MS - 1), T)).toBe(false);
    expect(shouldRename("a", "b", T - RENAME_MIN_INTERVAL_MS, T)).toBe(true);
  });
});

describe("sessionsToPing", () => {
  const lead = 60 * MIN;
  const race = session({ start: T });

  test("inside [start - lead, start)", () => {
    expect(sessionsToPing([race], new Set(), lead, T - 61 * MIN)).toEqual([]);
    expect(sessionsToPing([race], new Set(), lead, T - 60 * MIN)).toEqual([race]);
    expect(sessionsToPing([race], new Set(), lead, T - 1)).toEqual([race]);
    expect(sessionsToPing([race], new Set(), lead, T)).toEqual([]);
  });

  test("never pings a non-pingable session", () => {
    const fp = session({ start: T, sessionId: "practice-1", pingable: false });
    expect(sessionsToPing([fp], new Set(), lead, T - MIN)).toEqual([]);
  });

  test("already-sent key is skipped even if start moved", () => {
    const moved = session({ start: T + 30 * MIN });
    expect(sessionsToPing([moved], new Set([sessionKey(moved)]), lead, T)).toEqual([]);
  });
});

describe("groupEvents / currentEvent", () => {
  const a1 = session({ eventId: "a", sessionId: "q", start: T - 120 * MIN, end: T - 60 * MIN });
  const a2 = session({ eventId: "a", sessionId: "race", start: T - 30 * MIN, end: T });
  const b1 = session({ eventId: "b", sessionId: "race", start: T + 7 * 24 * 60 * MIN });
  const all = [b1, a2, a1];

  test("groups by event in start order", () => {
    const events = groupEvents(all);
    expect(events.map((e) => e.eventId)).toEqual(["a", "b"]);
    expect(events[0]?.sessions).toEqual([a1, a2]);
  });

  test("current event is the first not yet finished", () => {
    expect(currentEvent(all, T - 1)?.eventId).toBe("a");
    expect(currentEvent(all, T)?.eventId).toBe("b");
    expect(currentEvent(all, b1.end.getTime())).toBeNull();
  });
});

describe("shouldDeleteMessage", () => {
  const channels = new Set(["c1"]);
  const base = { channelId: "c1", authorId: "u1", botId: "bot", system: false };

  test("anyone else's message in a series channel", () => {
    expect(shouldDeleteMessage(base, channels)).toBe(true);
  });
  test("the bot's own messages stay", () => {
    expect(shouldDeleteMessage({ ...base, authorId: "bot" }, channels)).toBe(false);
  });
  test("the bot's 'pinned a message' notice goes", () => {
    expect(shouldDeleteMessage({ ...base, authorId: "bot", system: true }, channels)).toBe(true);
  });
  test("other channels are untouched", () => {
    expect(shouldDeleteMessage({ ...base, channelId: "c2" }, channels)).toBe(false);
  });
});

test("withoutPinged drops sessions whose ping went out", () => {
  const event = {
    eventId: "e",
    eventName: "E",
    sessions: [
      session({ sessionId: "qualifying", start: T }),
      session({ sessionId: "race", start: T + 60 * MIN }),
    ],
  };
  expect(withoutPinged(event, new Set(["e/qualifying"])).sessions.map((s) => s.sessionId)).toEqual([
    "race",
  ]);
});
