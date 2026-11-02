import { expect, test } from "bun:test";
import { standings } from "../../../src/modules/duel/ranking.ts";
import type { Game } from "../../../src/modules/duel/types.ts";

const game = (
  userId: string,
  points: number,
  finishedAt: number,
  { correct = 3, date = "2026-11-03" } = {},
): Game => ({
  guildId: "g",
  date,
  userId,
  answers: "",
  correct,
  points,
  streak: 1,
  startedAt: 0,
  finishedAt,
});

test("sums points per player, highest first", () => {
  const list = standings([
    game("a", 100, 5),
    game("b", 300, 6),
    game("a", 250, 7, { date: "2026-11-04" }),
  ]);
  expect(list.map((s) => [s.userId, s.points, s.correct])).toEqual([
    ["a", 350, 6],
    ["b", 300, 3],
  ]);
});

test("ties go to more correct, then the earlier last finish, then user ID", () => {
  const list = standings([
    game("a", 100, 9, { correct: 3 }),
    game("b", 100, 1, { correct: 5 }),
    game("c", 100, 3),
    game("d", 100, 3),
  ]);
  expect(list.map((s) => s.userId)).toEqual(["b", "c", "d", "a"]);
  expect(list[0]?.lastFinishedAt).toBe(1);
});
