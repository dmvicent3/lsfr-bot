import { expect, test } from "bun:test";
import { IDLE_LIMIT, nextIdle } from "../../../src/modules/trivia/idle.ts";

test("an answered round resets the count", () => expect(nextIdle(2, true)).toBe(0));

test("an unanswered round adds one, reaching the limit at 3", () => {
  expect(nextIdle(2, false)).toBe(3);
  expect(IDLE_LIMIT).toBe(3);
});
