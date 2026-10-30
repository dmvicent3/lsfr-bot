import { expect, test } from "bun:test";
import { pageButtons } from "../../src/core/page-buttons.ts";

const ids = (rows: ReturnType<typeof pageButtons>): unknown[] =>
  rows.flatMap((r) => r.components.map((b) => b.custom_id));

test("one page has no buttons", () => expect(pageButtons("trivia:page", "week", 1, 1)).toEqual([]));

test("ids carry the prefix, period and target page", () => {
  expect(ids(pageButtons("trivia:page", "week", 2, 3))).toEqual([
    "trivia:page:week:1",
    "trivia:page:week:3",
  ]);
  expect(pageButtons("trivia:page", "week", 2, 3)[0]?.components.map((b) => b.disabled)).toEqual([
    false,
    false,
  ]);
});

test("ends are disabled", () => {
  expect(pageButtons("word:page", "all", 1, 2)[0]?.components.map((b) => b.disabled)).toEqual([
    true,
    false,
  ]);
  expect(pageButtons("word:page", "all", 2, 2)[0]?.components.map((b) => b.disabled)).toEqual([
    false,
    true,
  ]);
});
