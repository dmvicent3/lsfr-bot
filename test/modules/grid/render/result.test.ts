import { expect, test } from "bun:test";
import { flag } from "../../../../src/core/countries/flag.ts";
import { renderResult, shareGrid } from "../../../../src/modules/grid/render/result.ts";
import { cells, GRID, nameOf, obs, ptPoints, snapshot } from "./fixtures.ts";

const V = {
  scope: "2026-11-05",
  number: 3 as number | null,
  grid: GRID,
  cells: cells(),
  guesses: 9,
  lastMiss: null,
  points: 40,
  finished: true,
  untilNext: "3h 20m",
};

const best = (i: number): string =>
  GRID.answers[i]!.toSorted((a, b) => (obs.get(b) ?? 0) - (obs.get(a) ?? 0))[0]!;

test("filled and empty cell lines", () => {
  const lines = renderResult(V, snapshot).split("\n");
  expect(lines[0]).toBe(`A1 ${flag("PT")} Portugal +${ptPoints}`);
  const top = best(1);
  expect(lines[1]).toBe(`A2 — ${GRID.answers[1]!.length} fit, e.g. ${flag(top)} ${nameOf(top)}`);
});

test("stored points and next grid on a revisit", () => {
  const out = renderResult(V, snapshot).split("\n");
  expect(out.slice(-3)).toEqual(["**40 points**", "", "Next grid in 3h 20m"]);
});

test("award parts replace the stored total; practice has no next line", () => {
  const award = { points: 62, parts: ["1 cells: 22", "Streak 2: +5"] };
  const daily = renderResult({ ...V, award }, snapshot).split("\n");
  expect(daily.slice(-5)).toEqual([
    "1 cells: 22",
    "Streak 2: +5",
    "**+62 points**",
    "",
    "Next grid in 3h 20m",
  ]);
  const practice = renderResult({ ...V, scope: "practice", number: null }, snapshot);
  expect(practice).not.toContain("Next grid");
  expect(practice.split("\n").at(-1)).toBe("**40 points**");
});

test("share grid", () => {
  const c = cells();
  c[4] = "PT";
  expect(shareGrid(c)).toBe("🟩⬜⬜\n⬜🟩⬜\n⬜⬜⬜");
});
