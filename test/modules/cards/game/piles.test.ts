import { expect, test } from "bun:test";
import { discardCards, drawCards, newPile } from "../../../../src/modules/cards/game/piles.ts";

const cards = ["a", "b", "c", "d"];

test("draws never repeat until the pile is empty", () => {
  const pile = newPile(cards, Math.random);

  expect(drawCards(pile, 4, Math.random).toSorted()).toEqual(cards);
  expect(pile.draw).toEqual([]);
});

test("an empty draw pile reshuffles the discards", () => {
  const pile = newPile(cards, Math.random);
  const first = drawCards(pile, 4, Math.random);
  discardCards(pile, first.slice(0, 2));

  expect(drawCards(pile, 2, Math.random).toSorted()).toEqual(first.slice(0, 2).toSorted());
  expect(pile.discard).toEqual([]);
});

test("with both piles empty, fewer cards come back", () => {
  const pile = newPile(["a"], Math.random);

  expect(drawCards(pile, 3, Math.random)).toEqual(["a"]);
  expect(drawCards(pile, 3, Math.random)).toEqual([]);
});
