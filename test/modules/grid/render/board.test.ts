import { expect, test } from "bun:test";
import { renderBoard } from "../../../../src/modules/grid/render/board.ts";
import { cells, GRID } from "./fixtures.ts";

const V = {
  scope: "2026-11-05",
  number: 3 as number | null,
  grid: GRID,
  cells: cells(),
  guesses: 6,
  lastMiss: null,
  points: 74,
  finished: false,
};

test("daily header and rule lines", () => {
  expect(renderBoard(V)).toBe(
    [
      "Country grid #3 · Guesses 6/9 · 74 pts",
      "Rows: A Europe · B Asia · C Africa",
      "Columns: 1 Flag has red · 2 Island nation · 3 Landlocked",
    ].join("\n"),
  );
});

test("practice header has no points", () => {
  const head = renderBoard({ ...V, scope: "practice", number: null }).split("\n")[0];
  expect(head).toBe("Practice grid · Guesses 6/9");
});

test("miss line", () => {
  const out = renderBoard({ ...V, lastMiss: "Chad: isn't in Europe, isn't a monarchy" });
  expect(out.split("\n").at(-1)).toBe("❌ Chad: isn't in Europe, isn't a monarchy");
});
