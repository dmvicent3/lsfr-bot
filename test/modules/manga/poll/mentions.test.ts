import { describe, expect, test } from "bun:test";
import { chunkMentions, mentionText } from "../../../../src/modules/manga/poll/mentions.ts";

const ids = (count: number) =>
  Array.from({ length: count }, (_, k) => String(1_000_000_000_000_000_000n + BigInt(k)));

describe("chunkMentions", () => {
  test("no followers, no chunks", () => {
    expect(chunkMentions([])).toEqual([]);
  });

  test("300 long ids: every chunk fits 2000 characters and 100 ids, each id once", () => {
    const all = ids(300);
    const chunks = chunkMentions(all);
    expect(chunks.length).toBeGreaterThan(1);

    for (const c of chunks) {
      expect(mentionText(c).length).toBeLessThanOrEqual(2000);
      expect(c.length).toBeLessThanOrEqual(100);
    }

    expect(chunks.flat()).toEqual(all);
  });

  test("a small limit splits early", () => {
    expect(chunkMentions(["1", "2", "3"], 9)).toEqual([["1", "2"], ["3"]]);
  });

  test("mentionText", () => {
    expect(mentionText(["1", "2"])).toBe("<@1> <@2>");
  });
});
