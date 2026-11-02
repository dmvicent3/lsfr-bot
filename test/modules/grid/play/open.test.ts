import { beforeEach, expect, test } from "bun:test";
import { lcg } from "../../../../src/core/random.ts";
import { openDay } from "../../../../src/modules/grid/play/open.ts";
import { newPractice, openPractice } from "../../../../src/modules/grid/play/practice.ts";
import type { GridRepo } from "../../../../src/modules/grid/store/repo.ts";
import { freshDb, puzzle } from "../store/fixtures.ts";
import { snapshot } from "./fixtures.ts";

let repo: GridRepo;

beforeEach(() => {
  repo = freshDb().repo;
});

const view = (userId: string, snap = snapshot) => ({
  guildId: "g",
  userId,
  date: "2026-11-03",
  now: 5,
  snapshot: snap,
});

test("two players get the same puzzle and generation runs once", () => {
  const first = openDay(repo, view("u"))!;
  let reads = 0;
  const spy = new Proxy(snapshot, {
    get(target, key) {
      if (key === "countries") reads++;

      return Reflect.get(target, key);
    },
  });
  const second = openDay(repo, view("v", spy))!;

  expect(reads).toBe(0);
  expect(second.puzzle).toEqual(first.puzzle);
  expect(first.game.userId).toBe("u");
  expect(second.game.userId).toBe("v");
  expect(second.game.cells).toEqual(Array.from({ length: 9 }, () => ""));
});

test("generation failure stores nothing", () => {
  const none = { ...snapshot, countries: [] };

  expect(openDay(repo, view("u", none))).toBeNull();
  expect(repo.puzzles.get("g", "2026-11-03")).toBeNull();
  expect(repo.games.get("g", "2026-11-03", "u")).toBeNull();
});

test("a new puzzle avoids yesterday's rules", () => {
  const yesterday = puzzle({ date: "2026-11-02" });
  repo.puzzles.create(yesterday);
  const today = openDay(repo, view("u"))!.puzzle.grid;
  const used = [...yesterday.grid.rows, ...yesterday.grid.cols];

  expect([...today.rows, ...today.cols].some((id) => used.includes(id))).toBe(false);
});

test("practice is kept until New, and never touches the daily game", () => {
  const day = openDay(repo, view("u"))!;
  const v = { guildId: "g", userId: "u", now: 7, snapshot };
  const first = openPractice(repo, v, lcg(1))!;
  const again = openPractice(repo, v, lcg(2))!;
  const fresh = newPractice(repo, v, lcg(3))!;

  expect(again.grid).toEqual(first.grid);
  expect(fresh.startedAt).toBe(7);
  expect(repo.practice.get("g", "u")?.grid).toEqual(fresh.grid);
  expect(repo.games.get("g", "2026-11-03", "u")).toEqual(day.game);
  expect(repo.puzzles.get("g", "2026-11-03")).toEqual(day.puzzle);
});

test("practice generation failure stores nothing", () => {
  const none = { ...snapshot, countries: [] };
  const v = { guildId: "g", userId: "u", now: 1, snapshot: none };

  expect(newPractice(repo, v, lcg(1))).toBeNull();
  expect(repo.practice.get("g", "u")).toBeNull();
});
