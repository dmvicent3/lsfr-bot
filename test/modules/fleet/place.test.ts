import { expect, test } from "bun:test";
import { parseCell, shipCells } from "../../../src/modules/fleet/grid.ts";
import { fillFleet, nextKind, placeAt, undoShip } from "../../../src/modules/fleet/place.ts";
import { type Dir, FLEET, type Ship } from "../../../src/modules/fleet/types.ts";
import { fleetAt } from "./fixtures.ts";

const at = (start: string, dir: Dir) => ({ start: parseCell(start) ?? -1, dir });

function placed(ships: Ship[], start: string, dir: Dir): Ship[] {
  const next = placeAt(ships, at(start, dir));

  if ("error" in next) throw new Error(next.error);

  return next;
}

function expectLegal(ships: Ship[]): void {
  expect(ships.map((s) => s.kind)).toEqual([0, 1, 2, 3, 4]);
  expect(new Set(ships.flatMap((s) => s.cells)).size).toBe(17);

  for (const s of ships) {
    const size = FLEET[s.kind]?.size ?? 0;
    const lines = [
      shipCells(s.cells[0] ?? -1, size, "across"),
      shipCells(s.cells[0] ?? -1, size, "down"),
    ];
    expect(lines).toContainEqual(s.cells);
  }
}

test("ships go in fleet order", () => {
  expect(nextKind([])).toBe(0);
  let ships = placed([], "A1", "across");
  expect(nextKind(ships)).toBe(1);
  ships = placed(ships, "A2", "across");
  ships = placed(ships, "A3", "across");
  ships = placed(ships, "A4", "across");
  ships = placed(ships, "A5", "across");
  expect(nextKind(ships)).toBeNull();
  expect(placeAt(ships, at("A7", "across"))).toEqual({ error: "done" });
});

test("off the grid and overlaps are refused, touching is fine", () => {
  const one = placed([], "A1", "across");
  expect(placeAt(one, at("C1", "down"))).toEqual({ error: "overlap" });
  expect(placeAt(one, at("H5", "across"))).toEqual({ error: "off-grid" });
  expect(placed(one, "A2", "across")).toHaveLength(2);
});

test("undo removes the last ship only", () => {
  const two = placed(placed([], "A1", "across"), "A2", "across");
  expect(undoShip(two)).toEqual(two.slice(0, 1));
  expect(undoShip([])).toEqual([]);
});

test("fillFleet completes any fleet legally", () => {
  const cramped = fleetAt({
    0: { start: "A1", dir: "down" },
    1: { start: "B1", dir: "down" },
    2: { start: "C1", dir: "down" },
  });
  expectLegal(fillFleet([], Math.random));
  expectLegal(fillFleet(cramped, () => 0));
});
