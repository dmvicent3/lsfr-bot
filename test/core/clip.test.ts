import { expect, test } from "bun:test";
import { clip } from "../../src/core/clip.ts";

test("short text is kept", () => {
  expect(clip("abc", 3)).toBe("abc");
});

test("long text is cut to max with an ellipsis as the last character", () => {
  expect(clip("abcdef", 4)).toBe("abc…");
  expect(clip("abcdef", 1)).toBe("…");
});
