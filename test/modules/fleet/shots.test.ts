import { expect, test } from "bun:test";
import { allSunk, hits, shotResult, sunkShips } from "../../../src/modules/fleet/shots.ts";
import { fleetAt } from "./fixtures.ts";

const boat = fleetAt({ 4: { start: "A1", dir: "across" } });

test("hit, sunk and miss", () => {
  expect(shotResult(boat, [0], 0)).toEqual({ kind: "hit", ship: 4, sunk: false });
  expect(shotResult(boat, [0, 1], 1)).toEqual({ kind: "hit", ship: 4, sunk: true });
  expect(shotResult(boat, [5], 5)).toEqual({ kind: "miss" });
});

test("sunk ships, all sunk and hits", () => {
  expect(allSunk(boat, [0])).toBe(false);
  expect(allSunk(boat, [0, 5, 1])).toBe(true);
  expect(sunkShips(boat, [0])).toEqual([]);
  expect(sunkShips(boat, [1, 0])).toEqual([4]);
  expect(hits(boat, [0, 5, 6, 1])).toBe(2);
});
