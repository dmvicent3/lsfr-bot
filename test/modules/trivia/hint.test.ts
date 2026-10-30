import { expect, test } from "bun:test";
import { mask, revealOrder } from "../../../src/modules/trivia/hint.ts";

const fixed = () => 0.5;

const shown = (text: string): number =>
  Array.from(text).filter((c) => c !== "*" && c !== " ").length;

test("level 0 masks every letter and digit, keeping spaces and punctuation", () => {
  expect(mask("New York", revealOrder("New York", fixed), 0)).toBe("*** ****");
  expect(mask("AC-130", revealOrder("AC-130", fixed), 0)).toBe("**-***");
});

test("first letters of each word come first in the order", () => {
  const order = revealOrder("New York", fixed);

  expect(order.slice(0, 2).toSorted((a, b) => a - b)).toEqual([0, 4]);
  expect(order.toSorted((a, b) => a - b)).toEqual([0, 1, 2, 4, 5, 6, 7]);
});

test("level 1 shows a third, level 2 two thirds, cumulatively", () => {
  const order = revealOrder("permission", Math.random);
  const one = mask("permission", order, 1);
  const two = mask("permission", order, 2);

  expect(shown(one)).toBe(4);
  expect(one[0]).toBe("p");
  expect(shown(two)).toBe(7);

  for (const [i, c] of Array.from(one).entries()) if (c !== "*") expect(two[i]).toBe(c);
});
