import { expect, test } from "bun:test";
import { soleSurvivor } from "../../../src/modules/trivia/perk.ts";

test("the only right pick among two or more earns the perk", () => {
  expect(
    soleSurvivor([
      { userId: "a", right: true },
      { userId: "b", right: false },
    ]),
  ).toBe("a");
});

test("a lone player never earns it", () => {
  expect(soleSurvivor([{ userId: "a", right: true }])).toBeNull();
});

test("two right picks, or none, earn nothing", () => {
  expect(
    soleSurvivor([
      { userId: "a", right: true },
      { userId: "b", right: true },
    ]),
  ).toBeNull();
  expect(
    soleSurvivor([
      { userId: "a", right: false },
      { userId: "b", right: false },
    ]),
  ).toBeNull();
});
