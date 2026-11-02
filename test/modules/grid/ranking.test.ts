import { expect, test } from "bun:test";
import { standings } from "../../../src/modules/grid/ranking.ts";
import type { Game } from "../../../src/modules/grid/types.ts";

const g = (
  userId: string,
  points: number,
  finishedAt: number,
  { filled = 5, date = "2026-11-03" } = {},
): Game => ({
  guildId: "g",
  date,
  userId,
  cells: [],
  guesses: 9,
  lastMiss: null,
  filled,
  points,
  streak: 1,
  startedAt: 0,
  finishedAt,
});

test("sums points per player, highest first", () => {
  const list = standings([g("a", 100, 5), g("b", 300, 6), g("a", 250, 7, { date: "2026-11-04" })]);

  expect(list.map((s) => [s.userId, s.points, s.filled])).toEqual([
    ["a", 350, 10],
    ["b", 300, 5],
  ]);
});

test("ties go to more filled, then the earlier finish, then user ID", () => {
  const list = standings([
    g("a", 100, 9, { filled: 3 }),
    g("b", 100, 1, { filled: 7 }),
    g("c", 100, 3),
    g("d", 100, 3),
  ]);

  expect(list.map((s) => s.userId)).toEqual(["b", "c", "d", "a"]);
  expect(list[0]?.lastFinishedAt).toBe(1);
});
