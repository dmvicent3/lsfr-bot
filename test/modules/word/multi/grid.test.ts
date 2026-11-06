import { expect, test } from "bun:test";
import { boardStates } from "../../../../src/modules/word/multi/boards.ts";
import { blocks, gridRows, joinCells } from "../../../../src/modules/word/multi/grid.ts";

const label = (g: string): string => `\`${g.toUpperCase()}\``;

test("boards go two to a block", () => {
  expect(blocks([1, 2])).toEqual([[1, 2]]);
  expect(blocks([1, 2, 3, 4])).toEqual([
    [1, 2],
    [3, 4],
  ]);
});

test("cells join with a divider; an empty last cell drops it, an empty first keeps it", () => {
  expect(joinCells(["a", "b"])).toBe("a │ b");
  expect(joinCells(["a", ""])).toBe("a");
  expect(joinCells(["", "b"])).toBe("│ b");
});

test("an empty cell before a filled one takes the spacer; trailing empties still drop", () => {
  expect(joinCells(["", "b"], "⬛")).toBe("⬛ │ b");
  expect(joinCells(["a", ""], "⬛")).toBe("a");
});

test("one row per guess, each board's squares side by side", () => {
  const boards = boardStates(["crane", "slate"], ["slate", "bumpy"]);
  expect(gridRows(boards, ["slate", "bumpy"], label)).toEqual([
    "`SLATE` ⬛⬛🟩⬛🟩 │ 🟩🟩🟩🟩🟩",
    "`BUMPY` ⬛⬛⬛⬛⬛",
  ]);
});

test("a board solved earlier holds its column with black boxes; no label for the share", () => {
  const boards = boardStates(["crane", "slate"], ["crane", "bumpy"]);
  expect(gridRows(boards, ["crane", "bumpy"])).toEqual([
    "🟩🟩🟩🟩🟩 │ ⬛⬛🟩⬛🟩",
    "⬛⬛⬛⬛⬛ │ ⬛⬛⬛⬛⬛",
  ]);
});

test("the last board solved early leaves its column empty: nothing after it to shift", () => {
  const boards = boardStates(["slate", "crane"], ["crane", "bumpy"]);
  expect(gridRows(boards, ["crane", "bumpy"], label)[1]).toBe("`BUMPY` ⬛⬛⬛⬛⬛");
});

test("a row empty on every board of the block is left out", () => {
  const boards = boardStates(["crane", "slate"], ["crane", "slate", "bumpy"]);
  expect(gridRows(boards, ["crane", "slate", "bumpy"])).toHaveLength(2);
});
