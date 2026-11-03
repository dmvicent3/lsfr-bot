import { describe, expect, test } from "bun:test";
import { leaks } from "../../../../src/modules/crossword/words/leak.ts";

describe("leaks", () => {
  test("whole word match", () => expect(leaks("a domestic cat", "cat")).toBe(true));
  test("synonyms do not leak", () => expect(leaks("feline pet", "cat")).toBe(false));
  test("inflected forms leak", () => {
    expect(leaks("walked slowly", "walking")).toBe(true);
    expect(leaks("a place for cakes", "cake")).toBe(true);
    expect(leaks("one who plays", "player")).toBe(true);
  });
  test("case-insensitive", () => expect(leaks("The CAT sat", "cat")).toBe(true));
  test("substring inside another word is not a leak", () => {
    expect(leaks("a concatenation", "cat")).toBe(false);
  });
  test("short stems are not stripped", () => expect(leaks("a bus route", "bud")).toBe(false));
});
