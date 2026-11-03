import { expect, test } from "bun:test";
import { clip, clipWords } from "../../src/core/clip.ts";

test("short text is kept", () => {
  expect(clip("abc", 3)).toBe("abc");
});

test("long text is cut to max with an ellipsis as the last character", () => {
  expect(clip("abcdef", 4)).toBe("abc…");
  expect(clip("abcdef", 1)).toBe("…");
});

test("clipWords keeps text that fits", () => {
  expect(clipWords("one two", 7)).toBe("one two");
});

test("clipWords cuts at the last word boundary before the limit", () => {
  expect(clipWords("one two three", 12)).toBe("one two…");
  expect(clipWords("one two three", 8)).toBe("one two…");
  expect(clipWords("one two, three", 10)).toBe("one two…");
  expect(clipWords("one two,  three", 12)).toBe("one two…");
});

test("clipWords falls back to a hard cut for a single long word", () => {
  expect(clipWords("abcdefgh", 4)).toBe("abc…");
});
