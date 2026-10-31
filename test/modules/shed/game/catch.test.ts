import { expect, test } from "bun:test";
import { catchOut } from "../../../../src/modules/shed/game/catch.ts";
import { drawOne } from "../../../../src/modules/shed/game/draw.ts";
import { playCards } from "../../../../src/modules/shed/game/play.ts";
import { card } from "../testing/cards.ts";
import { seeded } from "../testing/random.ts";
import { act, hand, table } from "../testing/table.ts";

const filler = () => [card("yellow", "1"), card("yellow", "2")];
const two = () => [card("red", "2"), card("blue", "9")];
const press = (g: ReturnType<typeof table>, userId: string) =>
  catchOut(g, { userId, random: seeded(2) });

test("playing down to one without calling it makes you catchable", () => {
  const g = table([two(), filler()], card("red", "7"));
  playCards(g, { ...act(g, "u1"), key: "red-2", count: 1, last: false });
  expect(g.seats[0]?.catchable).toBe(true);
});

test("with last: true you are not", () => {
  const g = table([two(), filler()], card("red", "7"));
  playCards(g, { ...act(g, "u1"), key: "red-2", count: 1, last: true });
  expect(g.seats[0]?.catchable).toBe(false);
});

test('catch: first press draws 2, second press "nobody"', () => {
  const g = table([two(), filler(), filler()], card("red", "7"));
  playCards(g, { ...act(g, "u1"), key: "red-2", count: 1, last: false });
  expect(press(g, "u3")).toBe("caught");
  expect(hand(g, "u1")).toHaveLength(3);
  expect(g.seats[0]?.catchable).toBe(false);
  expect(press(g, "u2")).toBe("nobody");
});

test("can't catch yourself", () => {
  const g = table([two(), filler()], card("red", "7"));
  playCards(g, { ...act(g, "u1"), key: "red-2", count: 1, last: false });
  expect(press(g, "u1")).toBe("self");
  expect(hand(g, "u1")).toHaveLength(1);
  expect(press(g, "u9")).toBe("not-in");
});

test("catchable clears when your next turn starts", () => {
  const g = table([two(), filler()], card("red", "7"));
  playCards(g, { ...act(g, "u1"), key: "red-2", count: 1, last: false });
  drawOne(g, act(g, "u2"));
  expect(g.seats[0]?.catchable).toBe(false);
  expect(press(g, "u2")).toBe("nobody");
});

test("a player made to draw is no longer on one card: nobody to catch", () => {
  const g = table([two(), [card("red", "plus2"), ...filler()]], card("red", "7"), {
    stacking: false,
  });
  playCards(g, { ...act(g, "u1"), key: "red-2", count: 1, last: false });
  playCards(g, { ...act(g, "u2"), key: "red-plus2", count: 1, last: false });
  expect(hand(g, "u1")).toHaveLength(3);
  expect(press(g, "u2")).toBe("nobody");
  expect(hand(g, "u1")).toHaveLength(3);
});
