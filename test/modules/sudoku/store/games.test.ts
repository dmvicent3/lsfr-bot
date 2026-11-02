import { beforeEach, expect, test } from "bun:test";
import type { SudokuRepo } from "../../../../src/modules/sudoku/store/repo.ts";
import { freshDb, game } from "./fixtures.ts";

let repo: SudokuRepo;

beforeEach(() => {
  repo = freshDb().repo;
});

const solved = (over = {}) => game({ solvedAt: 5, points: 100, streak: 1, ...over });

test("a game round-trips", () => {
  const g = repo.games.start(game());
  expect(repo.games.get(g)).toEqual(game());
  expect(repo.games.get({ ...g, userId: "x" })).toBeNull();
});

test("start twice keeps the first board", () => {
  repo.games.start(game({ cells: "1".repeat(80) + "5" }));
  const again = repo.games.start(game({ cells: "1".repeat(81) }));
  expect(again.cells).toBe("1".repeat(80) + "5");
});

test("replace swaps a practice game", () => {
  const p = { kind: "practice" as const, date: "", slot: "" };
  repo.games.replace(game({ ...p, startedAt: 1 }));
  const next = repo.games.replace(game({ ...p, startedAt: 2 }));
  expect(next.startedAt).toBe(2);
  expect(repo.games.get(next)?.startedAt).toBe(2);
});

test("save updates an open game", () => {
  repo.games.start(game());
  expect(repo.games.save(game({ cells: "2".repeat(81), cursor: 7, checks: 2 }))).toBe(true);
  const got = repo.games.get(game());
  expect(got?.cursor).toBe(7);
  expect(got?.checks).toBe(2);
});

test("save refuses a solved game", () => {
  repo.games.start(game());
  expect(repo.games.save(solved())).toBe(true);
  expect(repo.games.save(solved({ points: 999 }))).toBe(false);
  expect(repo.games.get(game())?.points).toBe(100);
});

test("solvedIn excludes practice, unsolved and out-of-range rows", () => {
  repo.games.start(solved({ slot: "easy" }));
  repo.games.start(solved({ slot: "hard", level: "hard", date: "2026-12-01" }));
  repo.games.start(game({ slot: "medium", level: "medium" }));
  repo.games.replace(solved({ kind: "practice", date: "", slot: "" }));
  const range = { from: "2026-11-01", to: "2026-11-30", label: "Nov" };
  expect(repo.games.solvedIn("g", range).map((g) => g.slot)).toEqual(["easy"]);
});

test("solvedBy lists a player's solved dailies oldest first", () => {
  repo.games.start(solved({ date: "2026-11-05" }));
  repo.games.start(solved({ date: "2026-11-03" }));
  repo.games.start(game({ date: "2026-11-04" }));
  repo.games.start(solved({ userId: "v", date: "2026-11-02" }));
  expect(repo.games.solvedBy("g", "u").map((g) => g.date)).toEqual(["2026-11-03", "2026-11-05"]);
});

test("lastSolvedBefore ignores the given date", () => {
  repo.games.start(solved({ date: "2026-11-03" }));
  repo.games.start(solved({ date: "2026-11-04" }));
  expect(repo.games.lastSolvedBefore("g", "u", "2026-11-04")?.date).toBe("2026-11-03");
  expect(repo.games.lastSolvedBefore("g", "u", "2026-11-03")).toBeNull();
});

test("solvedOn lists a player's solved dailies on one date", () => {
  repo.games.start(solved({ slot: "easy" }));
  repo.games.start(game({ slot: "hard", level: "hard" }));
  repo.games.start(solved({ slot: "medium", level: "medium", userId: "v" }));
  repo.games.start(solved({ date: "2026-11-04" }));
  expect(repo.games.solvedOn("g", "u", "2026-11-03").map((g) => g.slot)).toEqual(["easy"]);
});
