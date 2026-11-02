import { expect, test } from "bun:test";
import { ButtonStyle } from "discord.js";
import { buttons } from "../../../../src/modules/sudoku/render/buttons.ts";
import type { Game } from "../../../../src/modules/sudoku/types.ts";
import { GAME } from "./game.ts";

const labels = (g: Game) => buttons(g).map((r) => r.components.map((c) => c.label));
const ids = (g: Game) => buttons(g).flatMap((r) => r.components.map((c) => c.custom_id));

test("daily layout is three rows", () => {
  expect(labels(GAME)).toEqual([
    ["◀", "▲", "▼", "▶", "Clear"],
    ["1", "2", "3", "4", "5"],
    ["6", "7", "8", "9", "Check"],
  ]);
});

test("no action row holds more than five components", () => {
  expect(labels(GAME).map((r) => r.length)).toEqual([5, 5, 5]);

  for (const g of [GAME, { ...GAME, kind: "practice" as const }]) {
    for (const r of buttons(g)) expect(r.components.length).toBeLessThanOrEqual(5);
  }
});

test("daily IDs carry date and level", () => {
  expect(ids(GAME)).toEqual([
    "sudoku:move:left:daily:2026-11-05:easy",
    "sudoku:move:up:daily:2026-11-05:easy",
    "sudoku:move:down:daily:2026-11-05:easy",
    "sudoku:move:right:daily:2026-11-05:easy",
    "sudoku:clear:daily:2026-11-05:easy",
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `sudoku:put:${d}:daily:2026-11-05:easy`),
    "sudoku:check:daily:2026-11-05:easy",
  ]);
});

test("practice adds New alone in a fourth row and uses the practice suffix", () => {
  const g = { ...GAME, kind: "practice" as const };
  expect(labels(g).map((r) => r.length)).toEqual([5, 5, 5, 1]);
  expect(labels(g)[3]).toEqual(["New"]);
  expect(labels(g)[2]).toEqual(["6", "7", "8", "9", "Check"]);
  expect(ids(g)).toContain("sudoku:new:practice");
  expect(ids(g)).toContain("sudoku:put:7:practice");
});

test("Check is primary, New is success, the rest secondary", () => {
  const all = buttons({ ...GAME, kind: "practice" }).flatMap((r) => r.components);
  const style = (l: string) => all.find((c) => c.label === l)?.style;
  expect(style("Check")).toBe(ButtonStyle.Primary);
  expect(style("New")).toBe(ButtonStyle.Success);
  expect(style("5")).toBe(ButtonStyle.Secondary);
});

test("a solved game has no buttons", () => {
  expect(buttons({ ...GAME, solvedAt: 5 })).toEqual([]);
});
