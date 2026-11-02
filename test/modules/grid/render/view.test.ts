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

test("filled cell buttons stay enabled", () => {
  const buttons = gridView(V, snapshot).components.flatMap((r) => r.components);
  expect(buttons.some((b) => (b as { disabled?: boolean }).disabled)).toBe(false);
});

test("worst case finished board stays under 2000 chars", () => {
  const longest = snapshot.countries.toSorted((a, b) => b.name.length - a.name.length);
  const full = GRID.answers.map((a) => longest.find((c) => a.includes(c.iso2))?.iso2 ?? a[0]!);
  const out = gridView({ ...V, cells: full, guesses: 9, finished: true, points: 999 }, snapshot);
  expect(out.content.length).toBeLessThan(2000);
});
