import { expect, test } from "bun:test";
import { rankGames } from "../../src/core/ranking.ts";

interface G {
  userId: string;
  points: number | null;
  n: number;
  at: number | null;
}
const by = { secondary: (g: G) => g.n, at: (g: G) => g.at };

test("sums per player and orders by points, secondary, earlier finish, user ID", () => {
  const list = rankGames(
    [
      { userId: "a", points: 10, n: 1, at: 5 },
      { userId: "a", points: 10, n: 1, at: 9 },
      { userId: "b", points: 20, n: 1, at: 7 },
      { userId: "c", points: 20, n: 2, at: 8 },
      { userId: "d", points: 20, n: 1, at: 6 },
      { userId: "e", points: null, n: 0, at: null },
    ],
    by,
  );

  expect(list.map((s) => s.userId)).toEqual(["c", "a", "d", "b", "e"]);
  expect(list.find((s) => s.userId === "a")).toEqual({
    userId: "a",
    points: 20,
    secondary: 2,
    lastFinishedAt: 9,
  });
});

test("user ID breaks a full tie", () => {
  const list = rankGames(
    [
      { userId: "b", points: 1, n: 1, at: 1 },
      { userId: "a", points: 1, n: 1, at: 1 },
    ],
    by,
  );

  expect(list.map((s) => s.userId)).toEqual(["a", "b"]);
});
