import { describe, expect, test } from "bun:test";
import type { Chapter } from "../../../../src/modules/manga/api/types.ts";
import { decide } from "../../../../src/modules/manga/poll/decide.ts";

let n = 0;

function ch(number: string | null, readableAt = "2026-10-26T10:00:00+00:00"): Chapter {
  n += 1;

  return {
    id: `c${n}-${number ?? "x"}`,
    mangaId: "m1",
    number,
    title: null,
    group: "G",
    externalUrl: null,
    readableAt,
  };
}

const seen = (highest: number | null, unnumbered: string[] = []) => ({
  highest,
  unnumbered: new Set(unnumbered),
});

const numbers = (posts: ReturnType<typeof decide>) =>
  posts.map((p) => p.chapters.map((c) => c.number));

describe("decide", () => {
  test("two groups' uploads of one number: the earlier one only", () => {
    const late = ch("42", "2026-10-26T12:00:00+00:00");
    const early = ch("42", "2026-10-26T11:00:00+00:00");
    expect(decide([late, early], seen(41))).toEqual([
      { chapters: [early], highest: 42, unnumberedId: null },
    ]);
  });

  test("numbers at or below the highest seen are skipped", () => {
    expect(decide([ch("40"), ch("41")], seen(41))).toEqual([]);
  });

  test("each new chapter is a post, in number order, raising highest", () => {
    const posts = decide([ch("42"), ch("41")], seen(40));
    expect(numbers(posts)).toEqual([["41"], ["42"]]);
    expect(posts.map((p) => p.highest)).toEqual([41, 42]);
  });

  test("more than five new chapters become one post", () => {
    const chapters = ["38", "39", "40", "41", "42", "43"].map((x) => ch(x));
    const posts = decide(chapters.toReversed(), seen(37));
    expect(numbers(posts)).toEqual([["38", "39", "40", "41", "42", "43"]]);
    expect(posts[0]?.highest).toBe(43);
  });

  test("exactly five stay separate", () => {
    const chapters = ["1", "2", "3", "4", "5"].map((x) => ch(x));
    expect(decide(chapters, seen(null))).toHaveLength(5);
  });

  test("a decimal after its whole number is new", () => {
    expect(numbers(decide([ch("10"), ch("10.5")], seen(10)))).toEqual([["10.5"]]);
  });

  test("a oneshot is posted once, keeping highest", () => {
    const oneshot = ch(null);
    expect(decide([oneshot], seen(5))).toEqual([
      { chapters: [oneshot], highest: 5, unnumberedId: oneshot.id },
    ]);
    expect(decide([oneshot], seen(5, [oneshot.id]))).toEqual([]);
  });

  test("with nothing seen, chapter 1 is posted", () => {
    expect(numbers(decide([ch("1")], seen(null)))).toEqual([["1"]]);
  });
});
