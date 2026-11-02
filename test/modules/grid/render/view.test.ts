import { expect, test } from "bun:test";
import { gridView } from "../../../../src/modules/grid/render/view.ts";
import { cells, GRID, snapshot } from "./fixtures.ts";

const V = {
  scope: "2026-11-05",
  number: 3 as number | null,
  grid: GRID,
  cells: cells(),
  guesses: 1,
  lastMiss: null,
  points: 20,
  finished: false,
  untilNext: "1h",
};

const ids = (v: ReturnType<typeof gridView>) =>
  v.components.map((r) => r.components.map((c) => (c as { custom_id: string }).custom_id));

test("daily in progress: board, 3 cell rows, give up", () => {
  const v = gridView(V, snapshot);
  expect(v.content).toStartWith("Country grid #3 · Guesses 1/9 · 20 pts");
  expect(v.allowedMentions).toEqual({ parse: [] });
  expect(ids(v)[3]).toEqual(["grid:giveup:2026-11-05"]);
  expect(v.components).toHaveLength(4);
});

test("practice in progress: give up and new", () => {
  const v = gridView({ ...V, scope: "practice", number: null }, snapshot);
  expect(ids(v)[3]).toEqual(["grid:giveup:practice", "grid:new"]);
});

test("daily finished: result, no buttons", () => {
  const v = gridView({ ...V, finished: true }, snapshot);
  expect(v.content).toContain("Next grid in 1h");
  expect(v.components).toEqual([]);
});

test("practice finished: new stays", () => {
  const v = gridView({ ...V, scope: "practice", number: null, finished: true }, snapshot);
  expect(ids(v)).toEqual([["grid:new"]]);
});
