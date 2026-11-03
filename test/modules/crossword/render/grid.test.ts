import { expect, test } from "bun:test";
import { gridText } from "../../../../src/modules/crossword/render/grid.ts";
import { square } from "../play/fixtures.ts";

const puzzle = square();
const empty = ".".repeat(25);

test("empty board: each number sits right before its own cell, dots for empty cells", () => {
  expect(gridText(puzzle, empty, false)).toBe(
    ["¹· ²· ³· ⁴· ⁵·", "⁶·  ·  ·  ·  ·", "⁷·  ·  ·  ·  ·", "⁸·  ·  ·  ·  ·", "⁹·  ·  ·  ·  ·"].join(
      "\n",
    ),
  );
});

test("filled letters are uppercase", () => {
  const out = gridText(puzzle, `crane${".".repeat(20)}`, false).split("\n");

  expect(out[0]).toBe("¹C ²R ³A ⁴N ⁵E");
  expect(out[1]).toBe("⁶·  ·  ·  ·  ·");
});

test("reveal shows the solution in empty cells", () => {
  const out = gridText(puzzle, empty, true).split("\n");

  expect(out[0]).toBe("¹C ²R ³A ⁴N ⁵E");
  expect(out[4]).toBe("⁹S  T  E  M  S");
});

test("blocks are █ and a two-digit number widens every cell's number part", () => {
  const p = { ...puzzle, blocks: [0], slots: [{ n: 12, dir: "a" as const, cells: [1, 2, 3] }] };
  const cells = `#${".".repeat(24)}`;

  expect(gridText(p, cells, false).split("\n")[0]).toBe("  █ ¹²·   ·   ·   ·");
});

test("rows line up: one-digit numbers make 2-character cells joined by spaces", () => {
  for (const line of gridText(puzzle, empty, false).split("\n")) {
    expect(Array.from(line)).toHaveLength(14);
  }
});
