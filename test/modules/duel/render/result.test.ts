import { expect, test } from "bun:test";
import { renderResult } from "../../../../src/modules/duel/render/result.ts";
import { PUZZLE, game } from "./fixtures.ts";

const done = game("aaaba", { correct: 4, finishedAt: 2 });

test("result with an award", () => {
  expect(
    renderResult(PUZZLE, done, { points: 90, parts: ["4 correct: 80", "Streak 3: +10"] }, "5h 12m"),
  ).toBe(
    "🟩🟥🟩🟩🟩\n4/5 correct\n\n4 correct: 80\nStreak 3: +10\n**+90 points**\n\nNext puzzle in 5h 12m",
  );
});

test("result without an award", () => {
  expect(renderResult(PUZZLE, done, null, "12m")).toBe(
    "🟩🟥🟩🟩🟩\n4/5 correct\n\nNext puzzle in 12m",
  );
});
