import { expect, test } from "bun:test";
import type { RefusedReason } from "../../../src/modules/word/types.ts";
import { checkGuess, refusalText } from "../../../src/modules/word/validate.ts";

const base = {
  text: "",
  length: 5,
  accepted: new Set(["crane", "crate"]),
  guesses: [] as string[],
  finished: false,
};

test("trims and lowercases", () => {
  expect(checkGuess({ ...base, text: " CRANE " })).toEqual({ ok: true, word: "crane" });
});

test.each<[Partial<typeof base>, RefusedReason]>([
  [{ text: "crane", finished: true }, "finished"],
  [{ text: "cr4ne" }, "letters"],
  [{ text: "cr ne" }, "letters"],
  [{ text: "cran" }, "length"],
  [{ text: "zzzzz" }, "unknown"],
  [{ text: "crane", guesses: ["crane"] }, "repeat"],
])("refuses %o as %s", (over, reason) => {
  expect(checkGuess({ ...base, ...over })).toEqual({ ok: false, reason });
});

test("refusal texts", () => {
  const c = { length: 5, number: 4, wait: "3h 2m" };
  expect(refusalText("finished", c)).toBe("You've finished Word #4, next puzzle in 3h 2m.");
  expect(refusalText("letters", c)).toBe("Letters only.");
  expect(refusalText("length", c)).toBe("Guesses are 5 letters.");
  expect(refusalText("unknown", c)).toBe("That's not in the word list. No attempt used.");
  expect(refusalText("repeat", c)).toBe("You already tried that.");
});
