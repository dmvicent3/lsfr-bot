import { describe, expect, test } from "bun:test";
import { SUPPORTED_LENGTHS, wordLists } from "../../../../src/modules/word/words/load.ts";

describe("wordLists", () => {
  test("lengths 4 to 7", () => expect(SUPPORTED_LENGTHS).toEqual([4, 5, 6, 7]));

  test.each([4, 5, 6, 7])("length %i: answers are accepted words of that length", (n) => {
    const lists = wordLists(n);
    expect(lists?.answers.length).toBeGreaterThan(500);
    const shape = new RegExp(`^[a-z]{${n}}$`);

    for (const w of lists?.answers ?? []) {
      expect(w).toMatch(shape);
      expect(lists?.accepted.has(w)).toBe(true);
    }
  });

  test("5 letters accepts common guesses beyond the answers", () => {
    const lists = wordLists(5);
    expect(lists?.accepted.has("crane")).toBe(true);
    expect(lists?.accepted.size).toBeGreaterThan(lists?.answers.length ?? 0);
  });

  test("blocked words are guesses but never answers", () => {
    expect(wordLists(4)?.accepted.has("shit")).toBe(true);
    expect(wordLists(4)?.answers).not.toContain("shit");
  });

  test("an unsupported length has no lists", () => expect(wordLists(3)).toBeNull());

  test("the same lists object comes back twice", () => expect(wordLists(5)).toBe(wordLists(5)));
});

test("everyday words outside ENABLE are accepted guesses", () => {
  for (const w of ["admin", "cyber", "blogs", "bling"])
    expect(wordLists(5)?.accepted.has(w)).toBe(true);
});
