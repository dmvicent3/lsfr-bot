import { expect, test } from "bun:test";
import { FIRST_PUZZLE, periodRange } from "../../../src/modules/crossword/periods.ts";
import { standings } from "../../../src/modules/crossword/ranking.ts";
import { game } from "./store/fixtures.ts";

type Over = { solved?: boolean; date?: string };

const g = (userId: string, points: number, finishedAt: number, o: Over = {}) =>
  game({ userId, points, finishedAt, solved: o.solved ?? true, date: o.date ?? "2026-11-04" });

test("periods are labelled with the crossword number", () => {
  expect(FIRST_PUZZLE).toBe("2026-11-03");
  expect(periodRange("today", "2026-11-06")).toEqual({
    from: "2026-11-06",
    to: "2026-11-06",
    label: "Crossword #4",
  });
  expect(periodRange("week", "2026-11-06").from).toBe("2026-11-02");
});

test("sums points per player, highest first", () => {
  const list = standings([g("a", 100, 5), g("b", 300, 6), g("a", 250, 7, { date: "2026-11-05" })]);

  expect(list.map((s) => [s.userId, s.points, s.solved])).toEqual([
    ["a", 350, 2],
    ["b", 300, 1],
  ]);
});

test("ties go to more solved, then the earlier finish, then user ID", () => {
  const list = standings([
    g("a", 100, 9, { solved: false }),
    g("b", 100, 1),
    g("c", 100, 3),
    g("d", 100, 3),
  ]);

  expect(list.map((s) => s.userId)).toEqual(["b", "c", "d", "a"]);
  expect(list[0]?.lastFinishedAt).toBe(1);
});
