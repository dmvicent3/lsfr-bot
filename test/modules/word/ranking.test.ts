import { expect, test } from "bun:test";
import { rankOf, standings } from "../../../src/modules/word/ranking.ts";
import type { Game } from "../../../src/modules/word/types.ts";
import { game } from "./fixtures.ts";

const order = (games: Game[]): string[] => standings(games).map((s) => s.userId);
const d1 = "2026-10-27";
const d2 = "2026-10-28";
const SIX = Array<string>(6).fill("xxxxx");

test("points first", () => {
  expect(order([game("a", d1, { points: 120 }), game("b", d1, { points: 150 })])).toEqual([
    "b",
    "a",
  ]);
});

test("then wins", () => {
  expect(
    order([
      game("a", d1, { points: 150 }),
      game("b", d1, { points: 75 }),
      game("b", d2, { points: 75 }),
    ]),
  ).toEqual(["b", "a"]);
});

test("then fewer attempts per win", () => {
  expect(
    order([
      game("a", d1, { guesses: ["a", "b", "c", "d"] }),
      game("b", d1, { guesses: ["a", "b"] }),
    ]),
  ).toEqual(["b", "a"]);
});

test("then the earlier last finish", () => {
  expect(order([game("a", d1, { finishedAt: 20 }), game("b", d1, { finishedAt: 10 })])).toEqual([
    "b",
    "a",
  ]);
});

test("then user id", () => {
  expect(order([game("b", d1), game("a", d1)])).toEqual(["a", "b"]);
});

test("two players with no wins fall through to finish time", () => {
  const loss = { won: false, points: 5, guesses: SIX };
  expect(
    order([game("a", d1, { ...loss, finishedAt: 20 }), game("b", d1, { ...loss, finishedAt: 10 })]),
  ).toEqual(["b", "a"]);
});

test("a standing sums the player's games", () => {
  const [s] = standings([
    game("a", d1, { points: 120, finishedAt: 5 }),
    game("a", d2, { won: false, points: 5, guesses: SIX, finishedAt: 9 }),
  ]);
  expect(s).toEqual({
    userId: "a",
    points: 125,
    wins: 1,
    games: 2,
    avgAttempts: 3,
    lastFinishedAt: 9,
  });
});

test("rankOf is 1-based, null when absent", () => {
  const list = standings([game("a", d1, { points: 200 }), game("b", d1, { points: 100 })]);
  expect(rankOf(list, "b")).toBe(2);
  expect(rankOf(list, "z")).toBeNull();
});
