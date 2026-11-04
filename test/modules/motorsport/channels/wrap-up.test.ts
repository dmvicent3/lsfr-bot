import { expect, test } from "bun:test";
import {
  WRAP_UP_AFTER_MS,
  weekendsToWrapUp,
} from "../../../../src/modules/motorsport/channels/wrap-up.ts";
import type { Session } from "../../../../src/modules/motorsport/types.ts";

const RACE_END = Date.parse("2026-11-01T22:00:00Z");

function session(eventId: string, sessionId: string, end: number): Session {
  return {
    series: "f1",
    eventId,
    eventName: eventId,
    sessionId,
    title: sessionId,
    start: new Date(end - 3_600_000),
    end: new Date(end),
    pingable: true,
  };
}

const mexico = [
  session("mexico", "practice-1", RACE_END - 2 * 86_400_000),
  session("mexico", "qualifying", RACE_END - 86_400_000),
  session("mexico", "race", RACE_END),
];
const open = [{ eventId: "mexico", threadId: "t1" }];

test("an open weekend waits until 3 days after its race", () => {
  expect(weekendsToWrapUp(mexico, open, RACE_END + WRAP_UP_AFTER_MS - 1)).toEqual([]);
  expect(weekendsToWrapUp(mexico, open, RACE_END + WRAP_UP_AFTER_MS)).toEqual(open);
});

test("the last result session counts, not a later non-result session", () => {
  const withLater = [...mexico, session("mexico", "fan-event", RACE_END + 86_400_000)];
  expect(weekendsToWrapUp(withLater, open, RACE_END + WRAP_UP_AFTER_MS)).toEqual(open);
});

test("an event gone from the schedule wraps up at once", () => {
  expect(weekendsToWrapUp([], open, 0)).toEqual(open);
});

test("only due weekends are picked", () => {
  const vegas = [session("vegas", "race", RACE_END + 20 * 86_400_000)];
  const both = [...open, { eventId: "vegas", threadId: "t2" }];
  expect(weekendsToWrapUp([...mexico, ...vegas], both, RACE_END + WRAP_UP_AFTER_MS)).toEqual(open);
});
