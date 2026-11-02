import { expect, test } from "bun:test";
import { levenshtein } from "../../src/core/levenshtein.ts";
import { levenshtein as reexported } from "../../src/modules/trivia/match.ts";

test("levenshtein", () => {
  expect(levenshtein("kitten", "sitting")).toBe(3);
  expect(levenshtein("", "abc")).toBe(3);
  expect(levenshtein("same", "same")).toBe(0);
});

test("trivia keeps re-exporting it", () => {
  expect(reexported).toBe(levenshtein);
});
