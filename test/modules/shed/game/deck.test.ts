import { expect, test } from "bun:test";
import {
  cardKey,
  COLOURS,
  fullDeck,
  isWild,
  shuffle,
} from "../../../../src/modules/shed/game/deck.ts";
import { card } from "../testing/cards.ts";

test("the deck: 108 cards, 25 per colour, 8 wild", () => {
  const d = fullDeck();
  expect(d).toHaveLength(108);
  expect(new Set(d.map((c) => c.id)).size).toBe(108);

  for (const col of COLOURS) expect(d.filter((c) => c.colour === col)).toHaveLength(25);

  expect(d.filter((c) => c.value === "paint")).toHaveLength(4);
  expect(d.filter((c) => c.value === "paint4")).toHaveLength(4);
  expect(d.filter((c) => c.colour === "red" && c.value === "0")).toHaveLength(1);
  expect(d.filter((c) => c.colour === "red" && c.value === "7")).toHaveLength(2);
  expect(d.filter((c) => c.colour === "blue" && c.value === "plus2")).toHaveLength(2);
  expect(d.filter((c) => c.colour === "green" && c.value === "block")).toHaveLength(2);
  expect(d.filter((c) => c.colour === "yellow" && c.value === "turn")).toHaveLength(2);
});

test("identical cards share a key; wild cards have no colour", () => {
  expect(cardKey(card("red", "7"))).toBe("red-7");
  expect(cardKey(card("blue", "plus2"))).toBe("blue-plus2");
  expect(cardKey(card(null, "paint4"))).toBe("x-paint4");
  expect(isWild(card(null, "paint"))).toBe(true);
  expect(isWild(card("red", "block"))).toBe(false);
});

test("shuffle returns a new array with the same cards", () => {
  const d = fullDeck();
  const s = shuffle(d, () => 0.3);
  expect(s).not.toBe(d);
  expect(s.map((c) => c.id).toSorted((a, b) => a - b)).toEqual(d.map((c) => c.id));
});
