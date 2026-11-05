import { expect, test } from "bun:test";
import {
  andInto,
  letterBit,
  members,
  orInto,
  setBit,
} from "../../../../src/modules/crossword/generate/bits.ts";

test("members lists set bits in order, across words and at bit 31", () => {
  const bits = new Uint32Array(3);

  for (const k of [0, 5, 31, 32, 63, 70]) setBit(bits, k);

  expect(members(bits)).toEqual([0, 5, 31, 32, 63, 70]);
});

test("or and and", () => {
  const a = new Uint32Array([0b1100]);
  const b = new Uint32Array([0b1010]);
  const or = Uint32Array.from(a);
  const and = Uint32Array.from(a);

  orInto(or, b);
  andInto(and, b);

  expect(members(or)).toEqual([1, 2, 3]);
  expect(members(and)).toEqual([3]);
});

test("letterBit: a is bit 0, z bit 25", () => {
  expect(letterBit("az", 0)).toBe(1);
  expect(letterBit("az", 1)).toBe(1 << 25);
});
