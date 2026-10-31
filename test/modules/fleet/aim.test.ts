import { expect, test } from "bun:test";
import { MAX_CANDIDATES, candidates } from "../../../src/modules/fleet/aim.ts";
import { colOf, rowOf } from "../../../src/modules/fleet/grid.ts";
import { sightOf } from "../../../src/modules/fleet/sight.ts";
import { playing, rowsFleet } from "./fixtures.ts";
import { allBut, sight } from "./sights.ts";

const even = (i: number): boolean => (rowOf(i) + colOf(i)) % 2 === 0;

test("sightOf: jevos's view of the player's fleet", () => {
  // Flagship A1-E1 sunk, a hit on the Cruiser (A3), a miss at J10.
  const g = playing({ jevos: { ships: rowsFleet(), shots: [0, 1, 2, 3, 4, 20, 99] } });
  const s = sightOf(g);
  expect(s.sunk).toEqual([0, 1, 2, 3, 4]);
  expect(s.wounded).toEqual([20]);
  expect(s.misses).toEqual([99]);
  expect(s.afloat).toEqual([4, 3, 3, 2]);
  expect(s.fired.size).toBe(7);
});

test("easy hunts six unfired cells even with a wounded ship", () => {
  const cells = candidates(sight({ wounded: [44] }), "easy", Math.random);
  expect(cells).toHaveLength(MAX_CANDIDATES);
  expect(cells).not.toContain(44);
});

test("normal hunts the checkerboard", () => {
  const cells = candidates(sight({}), "normal", Math.random);
  expect(cells).toHaveLength(6);
  expect(cells.every(even)).toBe(true);
});

test("normal parity falls back", () => {
  const misses = Array.from({ length: 100 }, (_, i) => i).filter(even);
  const cells = candidates(sight({ misses }), "normal", Math.random);
  expect(cells).toHaveLength(6);
  expect(cells.some(even)).toBe(false);
});

test("a lone hit: its four neighbours", () => {
  expect(new Set(candidates(sight({ wounded: [44] }), "normal", Math.random))).toEqual(
    new Set([34, 43, 45, 54]),
  );
});

const at = (misses: number[]) =>
  new Set(candidates(sight({ wounded: [44, 45], misses }), "normal", Math.random));

test("two hits in line: the two open ends", () => {
  expect(at([])).toEqual(new Set([43, 46]));
  expect(at([43])).toEqual(new Set([46]));
  expect(at([43, 46])).toEqual(new Set([34, 35, 54, 55]));
});

test("hard never offers a cell no ship fits", () => {
  const s = sight({ misses: allBut([0, 89, 99]), afloat: [2] });
  expect(new Set(candidates(s, "hard", Math.random))).toEqual(new Set([89, 99]));
});

test("hard hunt takes the highest counts", () => {
  const cells = candidates(sight({}), "hard", Math.random);
  expect(cells).toHaveLength(6);
  expect(cells).toEqual(expect.arrayContaining([44, 45, 54, 55]));
});

test("hard target ranks neighbours by placements through the hit", () => {
  expect(new Set(candidates(sight({ wounded: [0] }), "hard", Math.random))).toEqual(
    new Set([1, 10]),
  );
});
