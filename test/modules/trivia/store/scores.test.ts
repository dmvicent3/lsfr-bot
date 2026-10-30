import { expect, test } from "bun:test";
import type { ScoreRow } from "../../../../src/modules/trivia/store/types.ts";
import { freshRepo } from "../fixtures.ts";

const row = (
  userId: string,
  points: number,
  at: number,
  over: Partial<ScoreRow> = {},
): ScoreRow => ({
  guildId: "g",
  userId,
  sessionId: 1,
  kind: "typed",
  itemId: 1,
  points,
  ms: 5_000,
  at,
  ...over,
});

test("standings sum points in the range, most first, ties by user ID", () => {
  const repo = freshRepo();
  repo.scores.add([row("b", 10, 100), row("a", 5, 100), row("a", 5, 150), row("c", 99, 200)]);

  expect(repo.scores.standings("g", 100, 200)).toEqual([
    { userId: "a", points: 10 },
    { userId: "b", points: 10 },
  ]);
});

test("other servers don't count", () => {
  const repo = freshRepo();
  repo.scores.add([row("a", 5, 100, { guildId: "other" })]);

  expect(repo.scores.standings("g", 0, 1_000)).toEqual([]);
});

test("stats split typed wins and KAOS items", () => {
  const repo = freshRepo();
  repo.scores.add([
    row("a", 10, 100, { ms: 4_000 }),
    row("a", 5, 110, { ms: 20_000 }),
    row("a", 10, 120, { kind: "kaos" }),
    row("a", 14, 130, { kind: "button" }),
  ]);

  expect(repo.scores.stats("g", "a", 0, 1_000)).toEqual({
    points: 39,
    typedWins: 2,
    avgTypedMs: 12_000,
    bestTypedMs: 4_000,
    kaosItems: 1,
  });
});

test("stats with nothing played", () => {
  expect(freshRepo().scores.stats("g", "a", 0, 1_000)).toEqual({
    points: 0,
    typedWins: 0,
    avgTypedMs: null,
    bestTypedMs: null,
    kaosItems: 0,
  });
});
