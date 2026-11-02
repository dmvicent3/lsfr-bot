import { expect, test } from "bun:test";
import { view } from "../../../../src/modules/duel/render/view.ts";
import { PUZZLE, game } from "./fixtures.ts";

const ctx = { number: 3, untilNext: "1h 0m" };

test("question state has pick buttons", () => {
  const v = view(PUZZLE, game("a"), ctx);
  expect(v.content).toStartWith("Stat duel #3 · Question 2/5");
  expect(v.components[0]?.components).toHaveLength(2);
  expect(v.allowedMentions).toEqual({ parse: [] });
});

test("revealed state has reveal, tally and Next", () => {
  const v = view(PUZZLE, game("a"), { ...ctx, revealed: true });
  expect(v.content).toBe(
    "✅ Right\n🇳🇱 Netherlands 521 /km² · 🇧🇪 Belgium 383 /km² (2023)\n\n🟩⬜⬜⬜⬜",
  );
  expect(v.components[0]?.components[0]?.custom_id).toBe("duel:next:2026-11-05");
});

test("last reveal shows the result with no buttons", () => {
  const g = game("aaaba", { correct: 4, finishedAt: 2 });
  const award = { points: 80, parts: ["4 correct: 80"] };
  const v = view(PUZZLE, g, { ...ctx, revealed: true, award });
  expect(v.content).toContain("✅ Right");
  expect(v.content).toContain("4/5 correct\n\n4 correct: 80\n**+80 points**");
  expect(v.components).toEqual([]);
});

test("finished state is the result", () => {
  const g = game("aaaba", { correct: 4, finishedAt: 2 });
  const v = view(PUZZLE, g, ctx);
  expect(v.content).toBe("🟩🟥🟩🟩🟩\n4/5 correct\n\nNext puzzle in 1h 0m");
  expect(v.components).toEqual([]);
});
