import { expect, test } from "bun:test";
import { cellName, neighbours, parseCell, shipCells } from "../../../src/modules/fleet/grid.ts";

const at = (name: string): number => parseCell(name) ?? -1;

test("cell names are letter then number", () => {
  expect(cellName(0)).toBe("A1");
  expect(cellName(42)).toBe("C5");
  expect(cellName(99)).toBe("J10");
  expect(parseCell("c5")).toBe(42);
  expect(parseCell("J10")).toBe(99);
  expect(parseCell("K1")).toBeNull();
  expect(parseCell("A11")).toBeNull();
});

test("neighbours are orthogonal and stay on the grid", () => {
  expect(new Set(neighbours(0))).toEqual(new Set([1, 10]));
  expect(new Set(neighbours(44))).toEqual(new Set([34, 43, 45, 54]));
});

test("a ship's cells, or null off the grid", () => {
  expect(shipCells(at("H1"), 3, "across")).toEqual([7, 8, 9]);
  expect(shipCells(at("I1"), 3, "across")).toBeNull();
  expect(shipCells(at("A9"), 2, "down")).toEqual([80, 90]);
  expect(shipCells(at("A10"), 2, "down")).toBeNull();
});
