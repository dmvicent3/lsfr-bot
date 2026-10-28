import { expect, test } from "bun:test";
import { pageButtons } from "../../../../src/modules/word/render/page-buttons.ts";

const ids = (rows: ReturnType<typeof pageButtons>): unknown[] =>
  rows[0]?.components.map((b) => ("custom_id" in b ? b.custom_id : null)) ?? [];

test("one page has no buttons", () => expect(pageButtons("week", 1, 1)).toEqual([]));

test("page buttons point at the neighbours", () => {
  expect(ids(pageButtons("week", 2, 3))).toEqual(["word:page:week:1", "word:page:week:3"]);
});

test("first page disables back, last disables next", () => {
  expect(pageButtons("all", 1, 2)[0]?.components.map((b) => b.disabled)).toEqual([true, false]);
  expect(pageButtons("all", 2, 2)[0]?.components.map((b) => b.disabled)).toEqual([false, true]);
});

test("a disabled edge button still has a distinct id", () => {
  expect(ids(pageButtons("all", 1, 2))).toEqual(["word:page:all:0", "word:page:all:2"]);
});
