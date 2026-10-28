import { expect, test } from "bun:test";
import { chooseWord } from "../../../src/modules/word/choose-word.ts";

test("skips used words", () => {
  expect(chooseWord(["a", "b", "c"], new Set(["a", "b"]), () => 0.99)).toBe("c");
});

test("starts over when all are used", () => {
  expect(chooseWord(["a", "b"], new Set(["a", "b"]), () => 0.6)).toBe("b");
});

test("uniform over the unused", () => {
  expect(chooseWord(["a", "b", "c", "d"], new Set(["b"]), () => 0.5)).toBe("c");
});
