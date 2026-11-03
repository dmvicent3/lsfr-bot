import { expect, test } from "bun:test";
import { gridText } from "../../../../src/modules/crossword/render/grid.ts";
import { square } from "../play/fixtures.ts";

const puzzle = square();
const empty = ".".repeat(25);

test("empty board: numbers in the first two characters, dots for empty cells", () => {
  expect(gridText(puzzle, empty, false)).toBe(
    [
      "¹ ·² ·³ ·⁴ ·⁵ ·",
      "⁶ ·  ·  ·  ·  ·",
      "⁷ ·  ·  ·  ·  ·",
      "⁸ ·  ·  ·  ·  ·",
      "⁹ ·  ·  ·  ·  ·",
    ].join("\n"),
  );
});

test("filled letters are uppercase", () => {
  const out = gridText(puzzle, `crane${".".repeat(20)}`, false).split("\n");

  expect(out[0]).toBe("¹ C² R³ A⁴ N⁵ E");
  expect(out[1]).toBe("⁶ ·  ·  ·  ·  ·");
});

test("reveal shows the solution in empty cells", () => {
  const out = gridText(puzzle, empty, true).split("\n");

  expect(out[0]).toBe("¹ C² R³ A⁴ N⁵ E");
  expect(out[4]).toBe("⁹ S  T  E  M  S");
});

test("blocks are █ and a two-digit number fills the number part", () => {
  const p = { ...puzzle, blocks: [0], slots: [{ n: 12, dir: "a" as const, cells: [1, 2, 3] }] };
  const cells = `#${".".repeat(24)}`;

  expect(gridText(p, cells, false).split("\n")[0]).toBe("  █¹²·  ·  ·  ·");
});

test("every cell is 3 characters", () => {
  for (const line of gridText(puzzle, empty, false).split("\n")) {
    expect(Array.from(line)).toHaveLength(15);
  }
});
