import { expect, test } from "bun:test";
import { COLOURS } from "../../../../src/modules/shed/game/deck.ts";
import { drawOne } from "../../../../src/modules/shed/game/draw.ts";
import { playCards } from "../../../../src/modules/shed/game/play.ts";
import type { Value } from "../../../../src/modules/shed/game/types.ts";
import { handView } from "../../../../src/modules/shed/render/hand.ts";
import { card } from "../testing/cards.ts";
import { act, table } from "../testing/table.ts";
import { ids, labelOf, rowsOf, text } from "./ids.ts";

const twoReds = () => [card("red", "2"), card("red", "2"), card("blue", "9"), card("blue", "8")];
const plays = (v: { components?: unknown }) => ids(v).filter((id) => id.startsWith("shed:play:"));

test("legal buttons only, and Draw", () => {
  const g = table(
    [[card("red", "2"), card("blue", "9"), card("yellow", "1")], []],
    card("red", "7"),
  );
  const v = handView(g, "u1", 1);
  expect(plays(v)).toEqual(["shed:play:1:red-2:1:0"]);
  expect(labelOf(v, "shed:draw:1")).toBe("Draw");
  expect(text(v)).toContain("🟥 2 · 🟨 1 · 🟦 9");
});

test("×2 with stacking on, not with it off", () => {
  const g = table([twoReds(), []], card("red", "7"));
  expect(plays(handView(g, "u1", 1))).toEqual(["shed:play:1:red-2:1:0", "shed:play:1:red-2:2:0"]);
  expect(labelOf(handView(g, "u1", 1), "shed:play:1:red-2:2:0")).toBe("🟥 2 ×2");
  const off = table([twoReds(), []], card("red", "7"), { stacking: false });
  expect(plays(handView(off, "u1", 1))).toEqual(["shed:play:1:red-2:1:0"]);
});

test('"+ Last card!" when 2 cards are held and one is played', () => {
  const g = table([[card("red", "2"), card("blue", "9")], []], card("red", "7"));
  const v = handView(g, "u1", 1);
  expect(plays(v)).toEqual(["shed:play:1:red-2:1:1"]);
  expect(labelOf(v, "shed:play:1:red-2:1:1")).toBe("🟥 2 + Last card!");
});

test("Take N with a waiting draw", () => {
  const g = table(
    [[card("red", "plus2"), card("blue", "9"), card("red", "1")], []],
    card("red", "plus2"),
  );
  g.pending = { kind: "plus2", total: 4 };
  const v = handView(g, "u1", 1);
  expect(plays(v)).toEqual(["shed:play:1:red-plus2:1:0"]);
  expect(labelOf(v, "shed:draw:1")).toBe("Take 4");
});

test("Play it / Pass after a draw; 4 colours after a Paint", () => {
  const g = table([[card("yellow", "1"), card("yellow", "2")], []], card("green", "7"));
  drawOne(g, act(g, "u1"));
  expect(ids(handView(g, "u1", 1))).toEqual(["shed:keep:1:0", "shed:pass:1"]);
  const p = table(
    [[card(null, "paint"), card("blue", "1"), card("red", "1")], [card("yellow", "5")]],
    card("red", "7"),
  );
  playCards(p, { ...act(p, "u1"), key: "x-paint", count: 1, last: false });
  expect(ids(handView(p, "u1", 1))).toEqual(COLOURS.map((c) => `shed:paint:1:${c}`));
});

test("hand pages: 25 legal cards → 20 and ▶ on page 1, the other 5 on page 2", () => {
  const values: Value[] = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "block",
    "turn",
    "plus2",
  ];
  const hand = COLOURS.flatMap((c) => values.map((v) => card(c, v))).slice(0, 25);
  const g = table([hand, []], card("red", "7"), { colour: null });
  const one = handView(g, "u1", 1);
  const two = handView(g, "u1", 2);
  expect(plays(one)).toHaveLength(20);
  expect(ids(one)).toContain("shed:page:2");
  expect(labelOf(one, "shed:page:2")).toBe("▶");
  expect(plays(two)).toHaveLength(5);
  expect(ids(two)).toContain("shed:page:1");

  for (const v of [one, two]) {
    expect(rowsOf(v).length).toBeLessThanOrEqual(5);
    expect(rowsOf(v).every((r) => r.length <= 5)).toBe(true);
    expect(ids(v).every((id) => id.length <= 100)).toBe(true);
  }
});

test("not your turn: your hand and who it's waiting for; not in it: one line", () => {
  const g = table([[card("red", "2")], [card("blue", "3")]], card("red", "7"));
  const v = handView(g, "u2", 1);
  expect(text(v)).toContain("Waiting for P1");
  expect(text(v)).toContain("🟦 3");
  expect(ids(v)).toEqual([]);
  expect(ids(handView(g, "u9", 1))).toEqual([]);
  expect(handView(g, "u9", 1).content).not.toContain("\n");
});
