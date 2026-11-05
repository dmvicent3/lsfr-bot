import type { Database } from "bun:sqlite";
import { beforeEach, expect, test } from "bun:test";
import { submitMultiGuess } from "../../../../src/modules/word/multi/guess.ts";
import type { MultiPuzzle } from "../../../../src/modules/word/multi/types.ts";
import type { WordRepo } from "../../../../src/modules/word/store/repo.ts";
import { freshDb, multiGame } from "../fixtures.ts";

let db: Database;
let repo: WordRepo;

beforeEach(() => {
  ({ db, repo } = freshDb());
});

const DUO: MultiPuzzle = {
  guildId: "g",
  mode: "duo",
  date: "2026-11-05",
  words: ["crane", "slate"],
  length: 5,
};
const MISSES = ["bumpy", "fjord", "glyph", "jumpy", "nymph", "vixen", "waltz"];
const accepted = new Set(["crane", "slate", ...MISSES]);
const guess = (text: string, puzzle = DUO) =>
  submitMultiGuess(db, repo, { puzzle, userId: "u", text, accepted, now: 1_000 });

test("a guess counts on every board and stays open", () => {
  expect(guess("slate")).toMatchObject({
    kind: "open",
    game: { guesses: ["slate"], finishedAt: null },
  });
});

test("a refused guess costs nothing", () => {
  expect(guess("zzzzz")).toEqual({ kind: "refused", reason: "unknown" });
  expect(guess("cran")).toEqual({ kind: "refused", reason: "length" });
  guess("slate");
  expect(guess("SLATE")).toEqual({ kind: "refused", reason: "repeat" });
  expect(repo.multiGames.get({ ...DUO, userId: "u" })?.guesses).toEqual(["slate"]);
});

test("solving every board wins with the unused attempts", () => {
  guess("bumpy");
  guess("slate");
  expect(guess("crane")).toMatchObject({
    kind: "finished",
    game: { won: true, found: 2, points: 140, streak: 1, finishedAt: 1_000 },
    award: { parts: ["100 for 2 words", "40 for 4 unused attempts"] },
  });
});

test("running out of attempts loses with 50 a word found", () => {
  guess("slate");

  for (const w of MISSES.slice(0, 5)) guess(w);

  expect(guess(MISSES[5]!)).toMatchObject({
    kind: "finished",
    game: { won: false, found: 1, points: 50, streak: 0 },
  });
  expect(guess(MISSES[6]!)).toEqual({ kind: "refused", reason: "finished" });
});

test("yesterday's full solve extends the streak", () => {
  repo.multiGames.finish(
    multiGame({ date: "2026-11-04", won: true, found: 2, points: 1, streak: 2, finishedAt: 1 }),
  );
  guess("slate");
  expect(guess("crane")).toMatchObject({ game: { streak: 3, points: 160 } });
});

test("modes keep their own games", () => {
  guess("slate");
  const quad = { ...DUO, mode: "quad" as const, words: ["crane", "slate", "bumpy", "fjord"] };
  expect(guess("slate", quad)).toMatchObject({ kind: "open", game: { guesses: ["slate"] } });
});
