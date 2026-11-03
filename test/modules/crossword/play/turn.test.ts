import { beforeEach, expect, test } from "bun:test";
import { emptyCells, solutionOf } from "../../../../src/modules/crossword/play/cells.ts";
import {
  answerSlot,
  revealLetter,
  type Turn,
} from "../../../../src/modules/crossword/play/turn.ts";
import type { CrosswordRepo } from "../../../../src/modules/crossword/store/repo.ts";
import { freshDb, game } from "../store/fixtures.ts";
import { col, row, square, word } from "./fixtures.ts";

let repo: CrosswordRepo;

beforeEach(() => {
  repo = freshDb().repo;
});

const start = (cells = emptyCells(square())): Turn => {
  const rec = repo.games.start(game({ cells }));

  return { repo, rec, puzzle: square(), now: 50 };
};

const stored = () => repo.games.get("g", "2026-11-03", "u")!;
const last = (sol: string) => sol.slice(0, 24) + ".";

test("a hit is stored and clears the last line", () => {
  const out = answerSlot(start(), row(0), "crane");

  expect(out.landed?.game.cells.slice(0, 5)).toBe("crane");
  expect(stored()).toMatchObject({ lastLine: null, wrong: 0 });
  expect(stored().cells.slice(0, 5)).toBe("crane");
});

test("a miss is stored with its line", () => {
  answerSlot(start(), row(0), "crate");

  expect(stored()).toMatchObject({ wrong: 1, lastLine: "❌ 1 Across: not CRATE" });
});

test("a bad answer stores nothing", () => {
  const out = answerSlot(start(), row(0), "cr");

  expect(out.landed).toBeNull();
  expect(stored().wrong).toBe(0);
});

test("a reveal is stored with its line and costs one", () => {
  revealLetter(start());

  expect(stored()).toMatchObject({ reveals: 1, lastLine: "🔎 Revealed a letter" });
  expect(
    stored()
      .cells.split("")
      .filter((c) => c !== "."),
  ).toHaveLength(1);
});

test("the last typed word finishes the game once, with the award", () => {
  const t = start(last(solutionOf(square())));
  const out = answerSlot(t, row(4), word(row(4)));

  expect(out.landed?.award?.points).toBe(100);
  expect(stored()).toMatchObject({ solved: true, points: 100, finishedAt: 50 });
  expect(answerSlot({ ...t, rec: stored() }, row(4), word(row(4))).outcome.kind).toBe("stale");
});

test("a reveal on the last empty cell finishes exactly like a typed word", () => {
  const sol = solutionOf(square());
  const t = start(last(sol));
  const out = revealLetter(t);

  expect(out.award?.points).toBe(90);
  expect(stored()).toMatchObject({ solved: true, reveals: 1, points: 90, finishedAt: 50 });
  expect(stored().cells).toBe(sol);
  expect(revealLetter({ ...t, rec: stored() }).award).toBeNull();
});

test("crossing words that fill the board finish the game, other clues count solved", () => {
  const t = start();
  const play = (slot: number) => answerSlot({ ...t, rec: stored() }, slot, word(slot));

  for (const c of [0, 1, 2, 3]) play(col(c));

  const out = play(col(4));

  expect(out.landed?.award?.points).toBe(100);
  expect(stored().solved).toBe(true);
});

test("an answer after the game ended is stale and stores nothing", () => {
  const t = start();
  const done = { ...stored(), finishedAt: 60 };
  const out = answerSlot({ ...t, rec: done }, row(0), "crane");

  expect(out).toEqual({ outcome: { kind: "stale" }, landed: null });
});
