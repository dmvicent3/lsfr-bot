import { expect, test } from "bun:test";
import { clueSelect } from "../../../../src/modules/crossword/render/select.ts";
import { bigView, V } from "./fixtures.ts";
import type { BoardView } from "../../../../src/modules/crossword/render/types.ts";

const twice = <T>(list: T[]): T[] => [...list, ...list];
const menu = (v: BoardView = V) => clueSelect(v).components[0]!;

test("lists only unsolved clues with labels and values", () => {
  const options = menu().options;

  expect(options).toHaveLength(9);
  expect(options[0]).toEqual({ label: "6 Across (5)", value: "6a", description: "clue 6a" });
  expect(options.map((o) => o.value)).not.toContain("1a");
  expect(options.at(-1)!.value).toBe("5d");
});

test("custom id and placeholder", () => {
  expect(menu().custom_id).toBe("crossword:pick:2026-11-05:mh1x");
  expect(menu().placeholder).toBe("Pick a clue");
});

test("description is the clue cut to 100", () => {
  const big = bigView();
  const clues = big.stored.clues.map((c) => c.padEnd(150, "y"));
  const options = menu({ ...big, stored: { ...big.stored, clues } }).options;

  for (const o of options) expect(o.description!.length).toBeLessThanOrEqual(100);

  expect(options[0]!.description).toEndWith("…");
});

test("at most 25 options on the densest 7×7", () => {
  expect(menu(bigView()).options.length).toBeLessThanOrEqual(25);
});

test("more than 25 unsolved clues is an error", () => {
  const { puzzle, clues } = bigView().stored;
  const doubled = {
    puzzle: { ...puzzle, slots: twice(puzzle.slots), answers: twice(puzzle.answers) },
    clues: twice(clues),
  };

  expect(() => clueSelect(bigView({ stored: doubled }))).toThrow();
});
