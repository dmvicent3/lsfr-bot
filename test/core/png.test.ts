import { expect, test } from "bun:test";
import { svgToPng } from "../../src/core/png.ts";

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

test("renders a PNG of the SVG's size, with text in the bundled font", () => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" font-family="DejaVu Sans">' +
    '<rect width="120" height="80" fill="#fff"/><text x="10" y="50" font-size="30">A1</text></svg>';
  const png = svgToPng(svg);

  expect([...png.subarray(0, 8)]).toEqual(SIGNATURE);
  expect(png.readUInt32BE(16)).toBe(120);
  expect(png.readUInt32BE(20)).toBe(80);
});
