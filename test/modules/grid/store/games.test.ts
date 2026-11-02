import { expect, test } from "bun:test";
import { freshDb, game } from "./fixtures.ts";

const done = (over = {}) => game({ filled: 3, points: 90, streak: 1, finishedAt: 9, ...over });

test("start twice keeps the first and round-trips cells", () => {
  const { repo } = freshDb();
  repo.games.start(game({ startedAt: 1 }));
  expect(repo.games.start(game({ startedAt: 2 })).startedAt).toBe(1);
  expect(repo.games.get("g", "2026-11-03", "u")).toEqual(game({ startedAt: 1 }));
  expect(repo.games.get("g", "2026-11-03", "x")).toBeNull();
});

test("save stores progress and refuses a finished game", () => {
  const { repo } = freshDb();
  const cells = ["PT", ...Array<string>(8).fill("")];
  repo.games.start(game());
  expect(repo.games.save(game({ cells, guesses: 2, lastMiss: "ES" }))).toBe(true);
  expect(repo.games.get("g", "2026-11-03", "u")).toMatchObject({
    cells,
    guesses: 2,
    lastMiss: "ES",
  });
  expect(repo.games.save(done({ cells }))).toBe(true);
  expect(repo.games.save(done({ points: 99 }))).toBe(false);
  expect(repo.games.get("g", "2026-11-03", "u")?.points).toBe(90);
});

test("finishedIn filters by range and skips unfinished games", () => {
  const { repo } = freshDb();

  for (const date of ["2026-11-01", "2026-11-03", "2026-11-05"]) {
    repo.games.start(game({ date }));
    repo.games.save(done({ date }));
  }

  repo.games.start(game({ date: "2026-11-04" }));
  const range = { from: "2026-11-02", to: "2026-11-04", label: "x" };
  expect(repo.games.finishedIn("g", range).map((g) => g.date)).toEqual(["2026-11-03"]);
});

test("finishedBy is oldest first; lastFinishedBefore is the latest earlier one", () => {
  const { repo } = freshDb();

  for (const date of ["2026-11-05", "2026-11-01", "2026-11-03"]) {
    repo.games.start(game({ date }));
    repo.games.save(done({ date }));
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
