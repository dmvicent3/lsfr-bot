import { expect, test } from "bun:test";
import { isLegal } from "../../../../src/modules/shed/game/legal.ts";
import { card } from "../testing/cards.ts";

test("legal: colour, value, symbol, wilds, a picked colour", () => {
  const top = card("red", "7");
  expect(isLegal(card("red", "2"), top, "red", null)).toBe(true);
  expect(isLegal(card("blue", "7"), top, "red", null)).toBe(true);
  expect(isLegal(card("blue", "2"), top, "red", null)).toBe(false);
  expect(isLegal(card(null, "paint4"), top, "red", null)).toBe(true);
  expect(isLegal(card("green", "block"), card("red", "block"), "red", null)).toBe(true);
  const painted = card(null, "paint");
  expect(isLegal(card("green", "3"), painted, "green", null)).toBe(true);
  expect(isLegal(card("red", "3"), painted, "green", null)).toBe(false);
  expect(isLegal(card("red", "3"), painted, null, null)).toBe(true);
});

test("with a waiting draw only the same draw card answers", () => {
  const plus2 = card("red", "plus2");
  const two = { kind: "plus2", total: 2 } as const;
  expect(isLegal(card("blue", "plus2"), plus2, "red", two)).toBe(true);
  expect(isLegal(card("red", "5"), plus2, "red", two)).toBe(false);
  expect(isLegal(card(null, "paint4"), plus2, "red", two)).toBe(false);
  const four = { kind: "paint4", total: 4 } as const;
  expect(isLegal(card(null, "paint4"), card(null, "paint4"), "red", four)).toBe(true);
  expect(isLegal(card("red", "plus2"), card(null, "paint4"), "red", four)).toBe(false);
});
