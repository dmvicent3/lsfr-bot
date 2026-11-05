import { expect, test } from "bun:test";
import { MODES, modeOf } from "../../../../src/modules/word/multi/modes.ts";

test("Duo is 2 boards in 7, Quad 4 in 9", () => {
  expect(MODES.duo).toEqual({ name: "Word Duo", boards: 2, attempts: 7 });
  expect(MODES.quad).toEqual({ name: "Word Quad", boards: 4, attempts: 9 });
});

test("modeOf reads a mode back, null otherwise", () => {
  expect(modeOf("quad")).toBe("quad");
  expect(modeOf("classic")).toBeNull();
  expect(modeOf(undefined)).toBeNull();
});
