import { expect, test } from "bun:test";
import { boardStates, foundCount, isOver } from "../../../../src/modules/word/multi/boards.ts";

const WORDS = ["crane", "slate"];

test("a board keeps its guesses up to the one that solved it", () => {
  expect(boardStates(WORDS, ["bumpy", "slate", "crane"])).toEqual([
    { word: "crane", guesses: ["bumpy", "slate", "crane"], solvedAt: 3 },
    { word: "slate", guesses: ["bumpy", "slate"], solvedAt: 2 },
  ]);
});

test("an unsolved board has every guess", () => {
  expect(boardStates(WORDS, ["bumpy"])[0]).toEqual({
    word: "crane",
    guesses: ["bumpy"],
    solvedAt: null,
  });
});

test("found and over", () => {
  expect(foundCount(WORDS, ["slate"])).toBe(1);
  expect(isOver(WORDS, ["slate"], 7)).toBe(false);
  expect(isOver(WORDS, ["slate", "crane"], 7)).toBe(true);
  expect(isOver(WORDS, ["a", "b", "c"], 3)).toBe(true);
});
