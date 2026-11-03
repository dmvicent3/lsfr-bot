import { beforeEach, expect, mock, test } from "bun:test";
import { emptyCells } from "../../../../src/modules/crossword/play/cells.ts";
import { openDaily } from "../../../../src/modules/crossword/play/open.ts";
import { newPractice, openPractice } from "../../../../src/modules/crossword/play/practice.ts";
import type { CrosswordRepo } from "../../../../src/modules/crossword/store/repo.ts";
import { freshDb } from "../store/fixtures.ts";
import { square, storedSquare } from "./fixtures.ts";

let repo: CrosswordRepo;

beforeEach(() => {
  repo = freshDb().repo;
});

const v = { guildId: "g", userId: "u", date: "2026-11-03", now: 5 };

test("the first daily open builds, stores and starts a game", async () => {
  const make = mock(async () => storedSquare());
  const out = await openDaily(repo, v, make);

  expect(make).toHaveBeenCalledTimes(1);
  expect(out?.puzzle.puzzle.answers).toEqual(square().answers);
  expect(out?.game).toMatchObject({ cells: emptyCells(square()), startedAt: 5, wrong: 0 });
  expect(repo.puzzles.get("g", v.date)).not.toBeNull();
});

test("the second open reads the stored puzzle without building", async () => {
  await openDaily(repo, v, async () => storedSquare());
  const make = mock(async () => storedSquare());
  const out = await openDaily(repo, { ...v, now: 99 }, make);

  expect(make).not.toHaveBeenCalled();
  expect(out?.game.startedAt).toBe(5);
});

test("another player shares the day's puzzle", async () => {
  await openDaily(repo, v, async () => storedSquare());
  const make = mock(async () => null);
  const out = await openDaily(repo, { ...v, userId: "w" }, make);

  expect(make).not.toHaveBeenCalled();
  expect(out?.game.userId).toBe("w");
});

test("no puzzle stores nothing", async () => {
  expect(await openDaily(repo, v, async () => null)).toBeNull();
  expect(repo.puzzles.get("g", v.date)).toBeNull();
  expect(repo.games.get("g", v.date, "u")).toBeNull();
});

const p = { guildId: "g", userId: "u", now: 7 };

test("practice opens a new round, then keeps it", async () => {
  const first = await openPractice(repo, p, 5, async () => storedSquare());
  const make = mock(async () => storedSquare());
  const again = await openPractice(repo, { ...p, now: 8 }, 5, make);

  expect(first?.startedAt).toBe(7);
  expect(make).not.toHaveBeenCalled();
  expect(again?.startedAt).toBe(7);
});

test("a practice open of another size starts a new puzzle", async () => {
  await openPractice(repo, p, 5, async () => storedSquare());
  const seven = { ...storedSquare(), puzzle: { ...square(), size: 7 as const } };
  const out = await openPractice(repo, { ...p, now: 9 }, 7, async () => seven);

  expect(out?.puzzle.size).toBe(7);
  expect(repo.practice.get("g", "u")?.startedAt).toBe(9);
});

test("New replaces the kept round; no puzzle keeps the old one", async () => {
  await openPractice(repo, p, 5, async () => storedSquare());

  expect(await newPractice(repo, { ...p, now: 12 }, async () => null)).toBeNull();
  expect(repo.practice.get("g", "u")?.startedAt).toBe(7);

  await newPractice(repo, { ...p, now: 12 }, async () => storedSquare());
  expect(repo.practice.get("g", "u")?.startedAt).toBe(12);
});
