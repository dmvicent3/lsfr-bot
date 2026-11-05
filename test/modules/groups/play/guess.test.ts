import { expect, test } from "bun:test";
import { NOT_A_GROUP, ONE_AWAY, REPEAT, guess } from "../../../../src/modules/groups/play/guess.ts";
import { progress } from "./fixtures.ts";

test("fewer than four picked is no guess", () => {
  expect(guess(progress({ picked: "012" }), true)).toBeNull();
});

test("a right group is found and the picks cleared", () => {
  const g = guess(progress({ picked: "4567", lastLine: "x" }), true)!;

  expect(g.progress).toMatchObject({ found: "1", picked: "", lastLine: null, mistakes: 0 });
  expect(g.end).toBeNull();
});

test("the fourth group solves", () => {
  expect(guess(progress({ found: "012", picked: "cdef" }), true)?.end).toBe("solved");
});

test("the third group also solves the last four words", () => {
  const g = guess(progress({ found: "20", picked: "4567" }), true)!;

  expect(g.progress.found).toBe("2013");
  expect(g.end).toBe("solved");
});

test("three of one group is one away and costs a mistake; the picks stay", () => {
  const g = guess(progress({ picked: "0124" }), true)!;

  expect(g.progress).toMatchObject({ mistakes: 1, picked: "0124", guesses: "0124" });
  expect(g.progress.lastLine).toBe(`${ONE_AWAY} (−15)`);
});

test("a plain wrong guess; practice shows no cost", () => {
  expect(guess(progress({ picked: "0148" }), false)?.progress.lastLine).toBe(NOT_A_GROUP);
});

test("repeating a wrong guess is free", () => {
  const g = guess(progress({ picked: "0148", guesses: "0124,0148", mistakes: 2 }), true)!;

  expect(g.progress).toMatchObject({ mistakes: 2, guesses: "0124,0148", lastLine: REPEAT });
  expect(g.end).toBeNull();
});

test("the fourth mistake loses", () => {
  const g = guess(progress({ picked: "0148", guesses: "0124,0125,0126", mistakes: 3 }), true)!;

  expect(g.progress.mistakes).toBe(4);
  expect(g.end).toBe("lost");
});
