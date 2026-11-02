import { beforeEach, expect, test } from "bun:test";
import { openDaily, openPractice } from "../../../../src/modules/sudoku/play/open.ts";
import type { SudokuRepo } from "../../../../src/modules/sudoku/store/repo.ts";
import { seeded } from "../../shed/testing/random.ts";
import { freshDb } from "../store/fixtures.ts";

let repo: SudokuRepo;

beforeEach(() => {
  repo = freshDb().repo;
});

const daily = (userId: string, seed = 1, now = 10) =>
  openDaily(repo, {
    guildId: "g",
    userId,
    date: "2026-11-03",
    level: "easy",
    now,
    random: seeded(seed),
  });

test("two players get the same givens", () => {
  const a = daily("a", 1);
  const b = daily("b", 2);
  expect(b.givens).toBe(a.givens);
  expect(b.solution).toBe(a.solution);
});

test("a new game starts at the first empty cell", () => {
  const g = daily("a");
  expect(g).toMatchObject({
    kind: "daily",
    slot: "easy",
    cells: g.givens,
    wrong: "0".repeat(81),
    cursor: g.givens.indexOf("0"),
    checks: 0,
    startedAt: 10,
    solvedAt: null,
    points: null,
    streak: null,
  });
});

test("reopening keeps the board", () => {
  const g = daily("a");
  const cells = g.cells.replace("0", "9");
  repo.games.save({ ...g, cells, checks: 2 });
  const again = daily("a", 3, 99);
  expect(again.cells).toBe(cells);
  expect(again.startedAt).toBe(10);
});

test("the puzzle is generated only once", () => {
  let calls = 0;

  const random = () => {
    calls++;

    return 0.5;
  };

  const v = { guildId: "g", date: "2026-11-03", level: "easy" as const, now: 1, random };
  openDaily(repo, { ...v, userId: "a", random: seeded(1) });
  openDaily(repo, { ...v, userId: "b" });
  expect(calls).toBe(0);
});

test("practice replaces the previous game", () => {
  const v = { guildId: "g", userId: "a", level: "easy" as const, now: 5 };
  const first = openPractice(repo, { ...v, random: seeded(1) });
  const second = openPractice(repo, { ...v, now: 6, random: seeded(2) });
  expect(second).toMatchObject({ kind: "practice", date: "", slot: "", startedAt: 6 });
  expect(second.givens).not.toBe(first.givens);
  expect(repo.games.get(second)?.givens).toBe(second.givens);
});
