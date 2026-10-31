import { expect, test } from "bun:test";
import { cardLabel } from "../../../../src/modules/shed/game/label.ts";
import { handText } from "../../../../src/modules/shed/render/text.ts";
import { card } from "../testing/cards.ts";

test("labels for each value", () => {
  expect(cardLabel(card("red", "7"))).toBe("🟥 7");
  expect(cardLabel(card("blue", "plus2"))).toBe("🟦 +2");
  expect(cardLabel(card("yellow", "block"))).toBe("🟨 Block");
  expect(cardLabel(card("green", "turn"))).toBe("🟩 Turn");
  expect(cardLabel(card(null, "paint"))).toBe("🎨 Paint");
  expect(cardLabel(card(null, "paint4"))).toBe("🎨 Paint +4");
});

test("the hand reads red, yellow, green, blue, then wilds; numbers before actions", () => {
  const hand = [
    card(null, "paint"),
    card("blue", "2"),
    card("red", "block"),
    card("red", "3"),
    card("yellow", "9"),
  ];
  expect(handText(hand)).toBe("🟥 3 · 🟥 Block · 🟨 9 · 🟦 2 · 🎨 Paint");
});
