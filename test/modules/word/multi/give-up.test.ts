import { expect, test } from "bun:test";
import { giveUpMulti } from "../../../../src/modules/word/multi/give-up.ts";
import { submitMultiGuess } from "../../../../src/modules/word/multi/guess.ts";
import type { MultiPuzzle } from "../../../../src/modules/word/multi/types.ts";
import { freshDb } from "../fixtures.ts";

const QUAD: MultiPuzzle = {
  guildId: "g",
  mode: "quad",
  date: "2026-11-05",
  words: ["crane", "slate", "bumpy", "fjord"],
  length: 5,
};

test("giving up loses, keeps 50 a word found and ends the streak", () => {
  const { db, repo } = freshDb();
  const accepted = new Set(QUAD.words);
  submitMultiGuess(db, repo, { puzzle: QUAD, userId: "u", text: "fjord", accepted, now: 1 });

  expect(giveUpMulti(db, repo, { puzzle: QUAD, userId: "u", now: 2 })).toMatchObject({
    kind: "finished",
    game: { won: false, found: 1, points: 50, streak: 0, finishedAt: 2 },
    award: { parts: ["50 for 1 word"] },
  });
  expect(giveUpMulti(db, repo, { puzzle: QUAD, userId: "u", now: 3 })).toEqual({
    kind: "refused",
    reason: "finished",
  });
});

test("giving up before any guess scores 0", () => {
  const { db, repo } = freshDb();
  expect(giveUpMulti(db, repo, { puzzle: QUAD, userId: "u", now: 2 })).toMatchObject({
    game: { guesses: [], points: 0 },
    award: { parts: ["no words found"] },
  });
});
