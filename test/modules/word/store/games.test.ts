import { beforeEach, expect, test } from "bun:test";
import type { WordRepo } from "../../../../src/modules/word/store/repo.ts";
import type { Game } from "../../../../src/modules/word/types.ts";
import { freshDb, game, seed } from "../fixtures.ts";

let repo: WordRepo;

beforeEach(() => {
  repo = freshDb().repo;
});

const OPEN: Game = {
  guildId: "g",
  date: "2026-10-28",
  userId: "u",
  guesses: ["slate"],
  won: null,
  points: null,
  streak: null,
  finishedAt: null,
};

test("an open game round-trips", () => {
  repo.games.saveGuesses(OPEN);
  expect(repo.games.get("g", "2026-10-28", "u")).toEqual(OPEN);
});

test("only the first finish of a row counts", () => {
  repo.games.saveGuesses(OPEN);
  const done = {
    ...OPEN,
    guesses: ["slate", "crane"],
    won: true,
    points: 140,
    streak: 1,
    finishedAt: 2,
  };
  expect(repo.games.finish(done)).toBe(true);
  expect(repo.games.finish({ ...done, points: 999 })).toBe(false);
  expect(repo.games.get("g", "2026-10-28", "u")?.points).toBe(140);
});

test("saveGuesses leaves a finished game alone", () => {
  seed(repo, game("u", "2026-10-28"));
  repo.games.saveGuesses({ ...OPEN, guesses: ["zzzzz"] });
  expect(repo.games.get("g", "2026-10-28", "u")?.guesses).toEqual(["aaaaa", "bbbbb", "ccccc"]);
});

test("lastFinished is the latest before a date", () => {
  seed(repo, game("u", "2026-10-26", { streak: 1 }));
  seed(repo, game("u", "2026-10-27", { streak: 2 }));
  seed(repo, game("u", "2026-10-28", { streak: 3 }));
  expect(repo.games.lastFinished("g", "u", "2026-10-28")).toEqual({
    date: "2026-10-27",
    won: true,
    streak: 2,
  });
  expect(repo.games.lastFinished("g", "u", "2026-10-26")).toBeNull();
});

test("finishedIn keeps to the range, the server and finished games", () => {
  seed(repo, game("a", "2026-10-26"));
  seed(repo, game("b", "2026-10-28"));
  seed(repo, { ...game("c", "2026-10-28"), guildId: "h" });
  repo.games.saveGuesses({ ...OPEN, userId: "d" });
  const rows = repo.games.finishedIn("g", { from: "2026-10-27", to: "2026-10-31", label: "" });
  expect(rows.map((r) => r.userId)).toEqual(["b"]);
});

test("finishedBy is one player's finished games", () => {
  seed(repo, game("a", "2026-10-26"));
  seed(repo, game("b", "2026-10-27"));
  expect(repo.games.finishedBy("g", "a").map((r) => r.date)).toEqual(["2026-10-26"]);
});
