import { expect, test } from "bun:test";
import { multiAward } from "../../../../src/modules/word/multi/scoring.ts";

test("a full solve: 50 a word, unused attempts and the streak bonus", () => {
  expect(multiAward({ found: 2, won: true, unused: 3, streak: 3 })).toEqual({
    points: 140,
    parts: ["100 for 2 words", "30 for 3 unused attempts", "10 streak bonus"],
  });
});

test("a loss keeps 50 a word found and nothing else", () => {
  expect(multiAward({ found: 3, won: false, unused: 0, streak: 0 })).toEqual({
    points: 150,
    parts: ["150 for 3 words"],
  });
  expect(multiAward({ found: 1, won: false, unused: 4, streak: 0 }).parts).toEqual([
    "50 for 1 word",
  ]);
});

test("nothing found is 0", () => {
  expect(multiAward({ found: 0, won: false, unused: 2, streak: 0 })).toEqual({
    points: 0,
    parts: ["no words found"],
  });
});
