import { expect, test } from "bun:test";
import { answer, correctCount, isDone } from "../../../../src/modules/duel/play/answer.ts";
import type { Puzzle } from "../../../../src/modules/duel/types.ts";
import { game, puzzle, question } from "../store/fixtures.ts";

const three: Puzzle = puzzle({ questions: [question(), question(), question()] });

test("the higher side is right, the other wrong", () => {
  const right = answer(three, game(), 1, "b");
  expect(right?.right).toBe(true);
  expect(right?.game.answers).toBe("b");
  const wrong = answer(three, game(), 1, "a");
  expect(wrong?.right).toBe(false);
  expect(wrong?.game.answers).toBe("a");
});

test("answer refuses n out of order", () => {
  expect(answer(three, game({ answers: "b" }), 1, "b")).toBeNull();
  expect(answer(three, game(), 3, "b")).toBeNull();
  expect(answer(three, game({ answers: "bb" }), 3, "b")?.game.answers).toBe("bbb");
});

test("answer refuses after finishing", () => {
  expect(answer(three, game({ answers: "bbb", finishedAt: 9 }), 4, "b")).toBeNull();
  expect(answer(three, game({ answers: "bbb" }), 4, "b")).toBeNull();
  expect(answer(three, game({ answers: "b", finishedAt: 9 }), 2, "b")).toBeNull();
});

test("isDone and correctCount", () => {
  expect(isDone(three, game({ answers: "bb" }))).toBe(false);
  expect(isDone(three, game({ answers: "bba" }))).toBe(true);
  expect(correctCount(three, "bba")).toBe(2);
  expect(correctCount(three, "")).toBe(0);
});
