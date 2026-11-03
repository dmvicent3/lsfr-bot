import { expect, test } from "bun:test";
import { gridSvg } from "../../../../src/modules/crossword/render/grid-svg.ts";
import { gridPng } from "../../../../src/modules/crossword/render/png.ts";
import { square } from "../play/fixtures.ts";

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

test("renders a PNG of the grid's size", () => {
  const png = gridPng(gridSvg(square(), `cR${".".repeat(23)}`, false));

  expect([...png.subarray(0, 8)]).toEqual(SIGNATURE);
  expect(png.readUInt32BE(16)).toBe(328);
  expect(png.readUInt32BE(20)).toBe(328);
});
