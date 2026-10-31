import { expect, test } from "bun:test";
import { points } from "../../../../src/modules/shed/game/points.ts";
import { card } from "../testing/cards.ts";
import { table } from "../testing/table.ts";

const placed = (places: (number | null)[], dropped: number[] = []) => {
  const g = table(
    places.map(() => [card("red", "1")]),
    card("red", "7"),
  );
  g.seats = g.seats.map((s, i) => ({
    ...s,
    place: places[i] ?? null,
    dropped: dropped.includes(i),
  }));

  return g;
};

test("4 ranked: 3, 2, 1, 0 by place", () => {
  expect(points(placed([2, 4, 1, 3]))).toEqual([
    { userId: "u3", place: 1, points: 3 },
    { userId: "u1", place: 2, points: 2 },
    { userId: "u4", place: 3, points: 1 },
    { userId: "u2", place: 4, points: 0 },
  ]);
});

test("a dropped player has no row", () => {
  expect(points(placed([1, null, 2], [1]))).toEqual([
    { userId: "u1", place: 1, points: 1 },
    { userId: "u3", place: 2, points: 0 },
  ]);
});

test("only 1 ranked: no points", () => {
  expect(points(placed([1, null, null], [1, 2]))).toEqual([]);
});
