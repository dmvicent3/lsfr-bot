import type { Database } from "bun:sqlite";
import { beforeEach, expect, test } from "bun:test";
import { submitGuess } from "../../../../src/modules/word/play/guess.ts";
import type { WordRepo } from "../../../../src/modules/word/store/repo.ts";
import { freshDb, game, seed } from "../fixtures.ts";

let db: Database;
let repo: WordRepo;

beforeEach(() => {
  ({ db, repo } = freshDb());
});

const G = {
  puzzle: { guildId: "g", date: "2026-10-28", word: "crane", length: 5 },
  userId: "u",
  text: "",
  accepted: new Set(["crane", "slate", "bumpy", "fjord", "glyph", "jumpy", "nymph"]),
  now: 1_000,
};
const guess = (text: string) => submitGuess(db, repo, { ...G, text });

test("a wrong guess stays open", () => {
  expect(guess("slate")).toMatchObject({
    kind: "open",
    game: { guesses: ["slate"], finishedAt: null },
  });
});

test("a refused guess changes nothing", () => {
  expect(guess("zzzzz")).toEqual({ kind: "refused", reason: "unknown" });
  expect(repo.games.get("g", "2026-10-28", "u")).toBeNull();
});

test("the right guess finishes with points", () => {
  expect(guess(" CRANE ")).toMatchObject({
    kind: "finished",
    game: { won: true, points: 150, streak: 1, finishedAt: 1_000 },
    award: { points: 150 },
  });
});

test("the sixth miss is a loss for 5", () => {
  for (const w of ["slate", "bumpy", "fjord", "glyph", "jumpy"]) guess(w);

  expect(guess("nymph")).toMatchObject({
    kind: "finished",
    game: { won: false, points: 5, streak: 0 },
  });
});

test("a guess after finishing is refused and points stay", () => {
  guess("crane");
  expect(guess("slate")).toEqual({ kind: "refused", reason: "finished" });
  expect(repo.games.get("g", "2026-10-28", "u")?.points).toBe(150);
});

test("yesterday's win extends the streak", () => {
  seed(repo, game("u", "2026-10-27", { streak: 2 }));
  expect(guess("crane")).toMatchObject({ kind: "finished", game: { streak: 3, points: 160 } });
});

test("players don't share games", () => {
  guess("crane");
  expect(submitGuess(db, repo, { ...G, userId: "v", text: "slate" }).kind).toBe("open");
});
