import { beforeEach, expect, test } from "bun:test";
import { emptyCells, solutionOf } from "../../../../src/modules/crossword/play/cells.ts";
import {
  answerSlot,
  checkGrid,
  revealLetter,
} from "../../../../src/modules/crossword/play/turn.ts";
import type { Turn } from "../../../../src/modules/crossword/play/types.ts";
import type { CrosswordRepo } from "../../../../src/modules/crossword/store/repo.ts";
import { freshDb, game, practice } from "../store/fixtures.ts";
import { row, square, word } from "./fixtures.ts";

let repo: CrosswordRepo;

beforeEach(() => {
  repo = freshDb().repo;
});

const SOL = solutionOf(square());
const WRONG = `z${SOL.slice(1)}`;

const start = (cells = emptyCells(square()), over = {}): Turn => {
  const rec = repo.games.start(game({ cells, ...over }));

  return { repo, rec, puzzle: square(), now: 50 };
};

const stored = () => repo.games.get("g", "2026-11-03", "u")!;

test("a typed word is stored with its line, unjudged and free", () => {
  const out = answerSlot(start(emptyCells(square()), { lastLine: "x" }), row(0), "crate");

  expect(out.landed?.game.cells.slice(0, 5)).toBe("crate");
  expect(stored()).toMatchObject({ lastLine: null, wrong: 0, finishedAt: null });
});

test("a bad answer stores nothing", () => {
  const out = answerSlot(start(), row(0), "cr");

  expect(out.landed).toBeNull();
  expect(stored().wrong).toBe(0);
});

test("typing the last correct word does not finish", () => {
  const out = answerSlot(start(`${SOL.slice(0, 20)}.....`), row(4), word(row(4)));

  expect(out.landed?.award).toBeNull();
  expect(stored()).toMatchObject({ finishedAt: null, cells: SOL });
});

test("Check on a correct grid finishes solved with the award, once", () => {
  const t = start(SOL);
  const out = checkGrid(t);

  expect(out.award?.points).toBe(100);
  expect(stored()).toMatchObject({ solved: true, points: 100, finishedAt: 50 });
  expect(checkGrid({ ...t, rec: stored() }).award).toBeNull();
});

test("Check on a wrong grid costs one check and says so", () => {
  const out = checkGrid(start(WRONG));

  expect(out.award).toBeNull();
  expect(stored()).toMatchObject({
    wrong: 1,
    finishedAt: null,
    lastLine: "❌ Not quite — some letters are wrong (−10)",
  });
});

test("Check on a grid with an empty cell changes nothing", () => {
  const t = start(`${SOL.slice(0, 24)}.`);

  expect(checkGrid(t)).toEqual({ game: t.rec, award: null });
  expect(stored().wrong).toBe(0);
});

test("a practice failed check shows no cost", () => {
  repo.practice.replace(practice({ cells: WRONG }));
  const rec = repo.practice.get("g", "u")!;
  checkGrid({ repo, rec, puzzle: square(), now: 5 });

  expect(repo.practice.get("g", "u")).toMatchObject({
    wrong: 1,
    lastLine: "❌ Not quite — some letters are wrong",
  });
});

test("a reveal is stored uppercase with its line and costs one", () => {
  revealLetter(start());

  expect(stored()).toMatchObject({ reveals: 1, lastLine: "🔎 Revealed a letter" });
  expect(stored().cells.replaceAll(".", "")).toMatch(/^[A-Z]$/);
});

test("a reveal that completes a correct grid finishes", () => {
  const t = start(`${SOL.slice(0, 24)}.`);
  const out = revealLetter(t);

  expect(out.award?.points).toBe(90);
  expect(stored()).toMatchObject({ solved: true, reveals: 1, points: 90, finishedAt: 50 });
  expect(stored().cells).toBe(`${SOL.slice(0, 24)}${SOL[24]!.toUpperCase()}`);
  expect(revealLetter({ ...t, rec: stored() }).award).toBeNull();
});

test("a reveal that fixes the only wrong cell finishes", () => {
  const out = revealLetter(start(WRONG));

  expect(out.award?.points).toBe(90);
  expect(stored().cells[0]).toBe("C");
});

test("a reveal on a grid already right acts as Check: solved, no cost", () => {
  const out = revealLetter(start(SOL));

  expect(out.award?.points).toBe(100);
  expect(stored()).toMatchObject({ solved: true, reveals: 0 });
});

test("an answer after the game ended is stale and stores nothing", () => {
  const t = start();
  const done = { ...stored(), finishedAt: 60 };

  expect(answerSlot({ ...t, rec: done }, row(0), "crane")).toEqual({
    entry: { kind: "stale" },
    landed: null,
  });
});
