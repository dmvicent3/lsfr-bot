import { expect, test } from "bun:test";
import { nextButton, pickButtons } from "../../../../src/modules/duel/render/buttons.ts";
import { PUZZLE } from "./fixtures.ts";

test("pick buttons carry flag, name and ids", () => {
  const [row] = pickButtons("2026-11-05", 2, PUZZLE.questions[1]!);
  expect(row?.components.map((c) => [c.label, c.custom_id])).toEqual([
    ["🇧🇪 Belgium", "duel:pick:2026-11-05:2:a"],
    ["🇳🇱 Netherlands", "duel:pick:2026-11-05:2:b"],
  ]);
});

test("next button", () => {
  const [row] = nextButton("2026-11-05");
  expect(row?.components.map((c) => [c.label, c.custom_id])).toEqual([
    ["Next", "duel:next:2026-11-05"],
  ]);
});
