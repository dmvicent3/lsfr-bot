import { expect, test } from "bun:test";
import { freshRepo } from "../fixtures.ts";

const rec = (userId: string, ms: number) => ({ guildId: "g", questionId: 7, userId, ms, at: 1 });

test("the first answer sets the record", () => {
  const repo = freshRepo();

  expect(repo.records.offer(rec("a", 17_550))).toEqual({ previous: null, improved: true });
  expect(repo.records.get("g", 7)?.ms).toBe(17_550);
});

test("only a faster answer replaces it", () => {
  const repo = freshRepo();
  repo.records.offer(rec("a", 17_550));

  expect(repo.records.offer(rec("b", 9_200))).toEqual({
    previous: rec("a", 17_550),
    improved: true,
  });
  expect(repo.records.offer(rec("c", 12_000))).toEqual({
    previous: rec("b", 9_200),
    improved: false,
  });
  expect(repo.records.get("g", 7)?.userId).toBe("b");
});
