import { expect, test } from "bun:test";
import { clashes, fits } from "../../../../src/modules/groups/generate/clash.ts";

test("a word inside another clashes, which covers -s and -es plurals", () => {
  expect(clashes("pike", "spike")).toBe(true);
  expect(clashes("bass", "basses")).toBe(true);
  expect(clashes("oak", "elm")).toBe(false);
});

test("-ies plurals clash both ways", () => {
  expect(clashes("berries", "berry")).toBe(true);
  expect(clashes("berry", "berries")).toBe(true);
});

test("fits: clashes with nothing on the board", () => {
  expect(fits("cod", ["oak", "elm"])).toBe(true);
  expect(fits("cod", ["coda"])).toBe(false);
});
