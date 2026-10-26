import { expect, test } from "bun:test";
import { chapterNumber } from "../../../../src/modules/manga/poll/number.ts";

test("chapterNumber reads decimals and rejects the rest", () => {
  expect(chapterNumber("42")).toBe(42);
  expect(chapterNumber("10.5")).toBe(10.5);
  expect(chapterNumber(null)).toBeNull();
  expect(chapterNumber("")).toBeNull();
  expect(chapterNumber("abc")).toBeNull();
});
