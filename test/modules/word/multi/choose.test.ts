import { expect, test } from "bun:test";
import { chooseWords } from "../../../../src/modules/word/multi/choose.ts";

const ANSWERS = ["aaaa", "bbbb", "cccc", "dddd", "eeee"];
const first = () => 0;

test("distinct words, none excluded, fresh ones first", () => {
  const s = { used: new Set(["bbbb"]), exclude: ["aaaa"], count: 2 };
  expect(chooseWords(ANSWERS, s, first)).toEqual(["cccc", "dddd"]);
});

test("once fresh words run out, used ones fill in, still distinct and not excluded", () => {
  const s = { used: new Set(ANSWERS), exclude: ["aaaa"], count: 4 };
  expect(chooseWords(ANSWERS, s, first)).toEqual(["bbbb", "cccc", "dddd", "eeee"]);
});

test("a fresh word is taken over a used one wherever it sits", () => {
  const s = { used: new Set(["aaaa", "bbbb", "cccc"]), exclude: [], count: 2 };
  expect(chooseWords(ANSWERS, s, first)).toEqual(["dddd", "eeee"]);
});

test("never more words than the list holds", () => {
  const s = { used: new Set<string>(), exclude: [], count: 2 };
  expect(chooseWords(["aaaa"], s, first)).toEqual(["aaaa"]);
});
