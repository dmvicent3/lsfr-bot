import { beforeEach, expect, test } from "bun:test";
import type { WordRepo } from "../../../../src/modules/word/store/repo.ts";
import { freshDb, multiGame } from "../fixtures.ts";

let repo: WordRepo;

beforeEach(() => {
  repo = freshDb().repo;
});

const OPEN = multiGame({ guesses: ["slate", "crane"] });
const done = (over = {}) =>
  multiGame({ won: true, found: 2, points: 150, streak: 1, finishedAt: 9, ...over });

test("an open game round-trips; a missing one is null", () => {
  repo.multiGames.saveGuesses(OPEN);
  expect(repo.multiGames.get(OPEN)).toEqual(OPEN);
  expect(repo.multiGames.get({ ...OPEN, mode: "quad" })).toBeNull();
});

test("only the first finish counts and a finished game keeps its guesses", () => {
  expect(repo.multiGames.finish(done())).toBe(true);
  expect(repo.multiGames.finish(done({ points: 1 }))).toBe(false);
  repo.multiGames.saveGuesses({ ...OPEN, guesses: ["other"] });
  expect(repo.multiGames.get(OPEN)).toEqual(done());
});

test("finished games read per mode", () => {
  repo.multiGames.finish(done());
  repo.multiGames.finish(done({ mode: "quad", date: "2026-11-04" }));
  repo.multiGames.saveGuesses(multiGame({ userId: "v" }));
  const all = { from: "2026-11-01", to: "2026-11-30", label: "x" };
  expect(repo.multiGames.finishedIn("duo", "g", all)).toEqual([done()]);
  expect(repo.multiGames.finishedBy("quad", "g", "u").map((g) => g.mode)).toEqual(["quad"]);
  expect(repo.multiGames.lastFinished({ ...OPEN, date: "2026-11-06" })).toEqual({
    date: "2026-11-05",
    won: true,
    streak: 1,
  });
  expect(repo.multiGames.lastFinished({ ...OPEN, mode: "quad", date: "2026-11-06" })?.date).toBe(
    "2026-11-04",
  );
});
