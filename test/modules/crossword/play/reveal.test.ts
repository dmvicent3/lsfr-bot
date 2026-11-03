import { expect, test } from "bun:test";
import { lcg } from "../../../../src/core/random.ts";
import { isFull, solutionOf } from "../../../../src/modules/crossword/play/cells.ts";
import { reveal, revealRandom } from "../../../../src/modules/crossword/play/reveal.ts";
import { game, practice } from "../store/fixtures.ts";
import { square, state } from "./fixtures.ts";

const filled = (cells: string): number => cells.split("").filter((c) => c !== ".").length;

test("reveal fills exactly one empty cell with its solution letter", () => {
  const out = reveal(state(), lcg(7));
  const at = out.cells.split("").findIndex((c) => c !== ".");

  expect(filled(out.cells)).toBe(1);
  expect(out.cells[at]).toBe(solutionOf(square())[at]);
  expect(out).toMatchObject({ reveals: 1, done: false });
});

test("the same random reveals the same cell", () => {
  expect(reveal(state(), lcg(7))).toEqual(reveal(state(), lcg(7)));
});

test("reveal on the last empty cell finishes the board", () => {
  const sol = solutionOf(square());
  const cells = sol.slice(0, 24) + ".";
  const out = reveal(state({ cells, reveals: 2 }), lcg(1));

  expect(out).toEqual({ cells: sol, reveals: 3, done: true });
  expect(isFull(out.cells)).toBe(true);
});

test("a full board reveals nothing", () => {
  const sol = solutionOf(square());

  expect(reveal(state({ cells: sol, reveals: 1 }), lcg(1))).toEqual({
    cells: sol,
    reveals: 1,
    done: true,
  });
});

test("revealRandom is per game and advances with each reveal", () => {
  const a = revealRandom(game({ reveals: 0 }))();
  const again = revealRandom(game({ reveals: 0 }))();
  const next = revealRandom(game({ reveals: 1 }))();
  const other = revealRandom(game({ date: "2026-11-04" }))();
  const prac = revealRandom(practice({ startedAt: 5 }))();

  expect(again).toBe(a);
  expect(next).not.toBe(a);
  expect(other).not.toBe(a);
  expect(prac).not.toBe(a);
  expect(revealRandom(practice({ startedAt: 5 }))()).toBe(prac);
});
