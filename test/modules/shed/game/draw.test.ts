import { expect, test } from "bun:test";
import { drawOne, keepDrawn, passDrawn } from "../../../../src/modules/shed/game/draw.ts";
import { card } from "../testing/cards.ts";
import { act, hand, table, turnOf } from "../testing/table.ts";

const filler = () => [card("yellow", "1"), card("yellow", "2")];

test("a drawn card that plays: keep it or pass", () => {
  const g = table([filler(), filler()], card("green", "7"));
  expect(drawOne(g, act(g, "u1"))).toBe("can-play");
  expect(g.step).toBe("drawn");
  expect(keepDrawn(g, { ...act(g, "u1"), last: false })).toBe("played");
  expect(hand(g, "u1")).toHaveLength(2);
  expect(turnOf(g)).toBe("u2");
  const h = table([filler(), filler()], card("green", "7"));
  drawOne(h, act(h, "u1"));
  expect(passDrawn(h, act(h, "u1"))).toBe("passed");
  expect(hand(h, "u1")).toHaveLength(3);
  expect(turnOf(h)).toBe("u2");
});

test("a drawn card that doesn't play passes the turn", () => {
  const g = table([filler(), filler()], card("red", "7"));
  expect(drawOne(g, act(g, "u1"))).toBe("passed");
  expect(hand(g, "u1")).toHaveLength(3);
  expect(turnOf(g)).toBe("u2");
  expect(keepDrawn(g, { ...act(g, "u2"), last: false })).toBe("wrong-step");
});

test("a waiting draw: take it all and miss the turn", () => {
  const g = table([filler(), filler(), filler()], card("red", "plus2"));
  g.pending = { kind: "plus2", total: 6 };
  expect(drawOne(g, act(g, "u1"))).toBe("took");
  expect(hand(g, "u1")).toHaveLength(8);
  expect(g.pending).toBeNull();
  expect(turnOf(g)).toBe("u2");
});

test("draw from empty piles: nothing to take, the game goes on", () => {
  const g = table([filler(), filler()], card("red", "plus2"));
  g.draw = [];
  g.pending = { kind: "plus2", total: 6 };
  expect(drawOne(g, act(g, "u1"))).toBe("took");
  expect(hand(g, "u1")).toHaveLength(2);
  expect(g.phase).toBe("playing");
  expect(turnOf(g)).toBe("u2");
});
