import { expect, test } from "bun:test";
import { deal, openPile } from "../../../../src/modules/shed/game/deal.ts";
import { takeCards } from "../../../../src/modules/shed/game/draw-pile.ts";
import { join } from "../../../../src/modules/shed/game/lobby.ts";
import { newGame } from "../../../../src/modules/shed/game/new.ts";
import type { Card, Game, Value } from "../../../../src/modules/shed/game/types.ts";
import { TURN_MS } from "../../../../src/modules/shed/game/types.ts";
import { card } from "../testing/cards.ts";
import { seeded } from "../testing/random.ts";

function seated(n: number): Game {
  const g = newGame({
    id: 1,
    guildId: "g",
    channelId: "c",
    starter: { userId: "u1", name: "P1" },
    stacking: true,
    now: 0,
  });

  for (let i = 2; i <= n; i++) join(g, { userId: `u${i}`, name: `P${i}` }, false);

  g.phase = "playing";

  return g;
}

/** A game whose draw pile has `first` on top (the last element), 10 numbers under it. */
function withTop(n: number, ...top: Card[]): Game {
  const g = seated(n);
  g.draw = [...Array.from({ length: 10 }, () => card("green", "3")), ...top];

  return g;
}

test("the deal: 7 each, one card face up, its colour to match, a turn running", () => {
  const g = seated(3);
  deal(g, 1000, seeded(4));
  expect(g.seats.every((s) => s.hand.length === 7)).toBe(true);
  expect(g.discard).toHaveLength(1);
  expect(g.draw).toHaveLength(108 - 21 - 1);
  expect(g.discard[0]?.value).not.toBe("paint4");
  expect(g.turnEndsAt).toBe(1000 + TURN_MS);
  expect(g.turnNo).toBe(1);
});

const opened = (n: number, value: Value) => {
  const g = withTop(n, card("red", value));
  openPile(g, 0, seeded(1));

  return g;
};

test("a first number: the first seat plays, its colour to match", () => {
  const g = opened(3, "5");
  expect(g.turn).toBe(0);
  expect(g.colour).toBe("red");
});

test("a first Block skips the first seat", () => {
  expect(opened(3, "block").turn).toBe(1);
});

test("a first Turn reverses: the last seat plays first; with 2 players it is a Block", () => {
  const g = opened(3, "turn");
  expect(g.direction).toBe(-1);
  expect(g.turn).toBe(2);
  expect(opened(2, "turn").turn).toBe(1);
});

test("a first +2: the first seat draws 2 and misses the turn", () => {
  const g = opened(3, "plus2");
  expect(g.seats[0]?.hand).toHaveLength(2);
  expect(g.turn).toBe(1);
});

test("a first Paint: no colour yet, the first seat plays anything", () => {
  const g = withTop(3, card(null, "paint"));
  openPile(g, 0, seeded(1));
  expect(g.colour).toBeNull();
  expect(g.turn).toBe(0);
});

test("a Paint +4 is never the first card", () => {
  const g = withTop(3, card("blue", "4"), card(null, "paint4"));
  openPile(g, 0, seeded(1));
  expect(g.discard.map((c) => c.value)).toEqual(["4"]);
  expect(g.draw.some((c) => c.value === "paint4")).toBe(true);
});

test("taking cards reshuffles the discard under its top card; nothing left gives fewer", () => {
  const g = seated(2);
  const top = card("red", "9");
  g.draw = [card("blue", "1")];
  g.discard = [card("blue", "2"), card("blue", "3"), top];
  expect(takeCards(g, 3, seeded(2))).toHaveLength(3);
  expect(g.discard).toEqual([top]);
  expect(takeCards(g, 2, seeded(2))).toEqual([]);
});
