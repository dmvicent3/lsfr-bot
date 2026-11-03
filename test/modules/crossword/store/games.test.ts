import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { runMigrations } from "../../../../src/core/db.ts";
import { crosswordMigrations } from "../../../../src/modules/crossword/store/migrations.ts";
import { freshDb, game } from "./fixtures.ts";

const done = (over = {}) =>
  game({ solved: true, points: 90, streak: 1, finishedAt: 9, wrong: 2, ...over });

test("migration creates the spec tables and index", () => {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, crosswordMigrations);
  const names = db
    .query<{ name: string }, []>("SELECT name FROM sqlite_master WHERE name LIKE 'crossword_%'")
    .all()
    .map((r) => r.name)
    .toSorted();
  expect(names).toEqual([
    "crossword_games",
    "crossword_games_by_day",
    "crossword_practice",
    "crossword_puzzles",
  ]);
  const defaults = db
    .query<{ name: string; dflt_value: string | null }, []>("PRAGMA table_info(crossword_games)")
    .all()
    .filter((c) => c.name === "wrong" || c.name === "reveals")
    .map((c) => c.dflt_value);
  expect(defaults).toEqual(["0", "0"]);
});

test("start twice keeps the first and round-trips", () => {
  const { repo } = freshDb();
  repo.games.start(game({ startedAt: 1 }));
  expect(repo.games.start(game({ startedAt: 2 })).startedAt).toBe(1);
  expect(repo.games.get("g", "2026-11-03", "u")).toEqual(game({ startedAt: 1 }));
  expect(repo.games.get("g", "2026-11-03", "x")).toBeNull();
});

test("save stores progress and refuses a finished game", () => {
  const { repo } = freshDb();
  const cells = "H" + ".".repeat(24);
  repo.games.start(game());
  expect(repo.games.save(game({ cells, wrong: 1, reveals: 1, lastLine: "x" }))).toBe(true);
  expect(repo.games.get("g", "2026-11-03", "u")).toMatchObject({
    cells,
    wrong: 1,
    reveals: 1,
    lastLine: "x",
  });
  expect(repo.games.finish(done({ cells }))).toBe(true);
  expect(repo.games.save(game({ cells: ".".repeat(25) }))).toBe(false);
  expect(repo.games.get("g", "2026-11-03", "u")).toMatchObject({ cells, solved: true });
});

test("finish writes the end state once; give up is stored as not solved", () => {
  const { repo } = freshDb();
  repo.games.start(game());
  expect(repo.games.finish(done({ solved: false, points: 0 }))).toBe(true);
  expect(repo.games.get("g", "2026-11-03", "u")).toMatchObject({ solved: false, points: 0 });
  expect(repo.games.finish(done())).toBe(false);
  expect(repo.games.get("g", "2026-11-03", "u")?.points).toBe(0);
});

test("finishedIn filters by range and skips unfinished games", () => {
  const { repo } = freshDb();

  for (const date of ["2026-11-01", "2026-11-03", "2026-11-05"]) {
    repo.games.start(game({ date }));
    repo.games.finish(done({ date }));
  }

  repo.games.start(game({ date: "2026-11-04" }));
  const range = { from: "2026-11-02", to: "2026-11-04", label: "x" };
  expect(repo.games.finishedIn("g", range).map((g) => g.date)).toEqual(["2026-11-03"]);
});

test("finishedBy is oldest first; lastFinishedBefore is the latest earlier one", () => {
  const { repo } = freshDb();

  for (const date of ["2026-11-05", "2026-11-01", "2026-11-03"]) {
    repo.games.start(game({ date }));
    repo.games.finish(done({ date }));
  }

  repo.games.start(game({ date: "2026-11-02" }));
  expect(repo.games.finishedBy("g", "u").map((g) => g.date)).toEqual([
    "2026-11-01",
    "2026-11-03",
    "2026-11-05",
  ]);
  expect(repo.games.lastFinishedBefore("g", "u", "2026-11-04")?.date).toBe("2026-11-03");
  expect(repo.games.lastFinishedBefore("g", "u", "2026-11-01")).toBeNull();
});
