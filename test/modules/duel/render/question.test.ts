import { expect, test } from "bun:test";
import { renderQuestion, tally } from "../../../../src/modules/duel/render/question.ts";
import { renderReveal } from "../../../../src/modules/duel/render/result.ts";
import { DIFF_YEARS, PUZZLE, game } from "./fixtures.ts";

test("tally: right, wrong and unanswered", () => {
  expect(tally(PUZZLE, "aab")).toBe("🟩🟥🟥⬜⬜");
  expect(tally(PUZZLE, "")).toBe("⬜⬜⬜⬜⬜");
  expect(tally(PUZZLE, "bb")).toBe("🟥🟩⬜⬜⬜");
});

test("question message", () => {
  expect(renderQuestion(PUZZLE, game("a"), 3)).toBe(
    "Stat duel #3 · Question 2/5\nWhich has the higher **population density**?\n🟩⬜⬜⬜⬜",
  );
});

test("reveal with the same year", () => {
  expect(renderReveal(PUZZLE.questions[0]!, "a")).toBe(
    "✅ Right\n🇳🇱 Netherlands 521 /km² · 🇧🇪 Belgium 383 /km² (2023)",
  );
});

test("reveal of a timeless stat shows no year", () => {
  const peak = { ...PUZZLE.questions[0]!, stat: "peak" as const };
  const at = (s: typeof peak.a) => ({ ...s, year: 2026 });

  expect(renderReveal({ ...peak, a: at(peak.a), b: at(peak.b) }, "a")).toBe(
    "✅ Right\n🇳🇱 Netherlands 521 m · 🇧🇪 Belgium 383 m",
  );
});

test("reveal with differing years", () => {
  expect(renderReveal(DIFF_YEARS, "b")).toBe(
    "❌ Wrong\n🇳🇱 Netherlands 521 /km² (2023) · 🇧🇪 Belgium 383 /km² (2021)",
  );
});
