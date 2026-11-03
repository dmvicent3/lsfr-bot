import { expect, test } from "bun:test";
import { lcg } from "../../../../src/core/random.ts";
import { solutionOf } from "../../../../src/modules/crossword/play/cells.ts";
import { reveal, revealRandom } from "../../../../src/modules/crossword/play/reveal.ts";
import { game, practice } from "../store/fixtures.ts";
import { square, state } from "./fixtures.ts";

const SOL = solutionOf(square());
const filled = (cells: string): number => cells.split("").filter((c) => c !== ".").length;

test("reveal writes one empty cell's solution letter, uppercase", () => {
  const out = reveal(state(), lcg(7))!;
  const at = out.cells.split("").findIndex((c) => c !== ".");

  expect(filled(out.cells)).toBe(1);
  expect(out.cells[at]).toBe(SOL[at]!.toUpperCase());
  expect(out.reveals).toBe(1);
});

test("the same random reveals the same cell", () => {
  expect(reveal(state(), lcg(7))).toEqual(reveal(state(), lcg(7)));
});

test("only wrong or empty cells are picked: a wrong typed letter gets fixed", () => {
  const cells = `z${SOL.slice(1)}`;

  for (const seed of [1, 2, 3, 4, 5]) {
    expect(reveal(state({ cells, reveals: 2 }), lcg(seed))).toEqual({
      cells: `C${SOL.slice(1)}`,
      reveals: 3,
    });
  }
});

test("a grid with nothing wrong reveals nothing", () => {
  expect(reveal(state({ cells: SOL, reveals: 1 }), lcg(1))).toBeNull();
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
