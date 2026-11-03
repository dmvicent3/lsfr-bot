import { expect, test } from "bun:test";
import { ButtonStyle } from "discord.js";
import { buttons } from "../../../../src/modules/sudoku/render/buttons.ts";
import type { Game } from "../../../../src/modules/sudoku/types.ts";
import { GAME } from "./game.ts";

const labels = (g: Game) => buttons(g).map((r) => r.components.map((c) => c.label));
const ids = (g: Game) => buttons(g).flatMap((r) => r.components.map((c) => c.custom_id));

test("daily layout is four rows, Notes, Undo and Clear all in the last", () => {
  expect(labels(GAME)).toEqual([
    ["◀", "▲", "▼", "▶", "Clear"],
    ["1", "2", "3", "4", "5"],
    ["6", "7", "8", "9", "Check"],
    ["✏️ Notes", "↩ Undo", "Clear all"],
  ]);
});

test("no action row holds more than five components", () => {
  expect(labels(GAME).map((r) => r.length)).toEqual([5, 5, 5, 3]);

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
    "sudoku:mode:daily:2026-11-05:easy",
    "sudoku:undo:daily:2026-11-05:easy",
    "sudoku:clearall:daily:2026-11-05:easy",
  ]);
});

test("practice adds New beside Notes, Undo and Clear all, and uses the practice suffix", () => {
  const g = { ...GAME, kind: "practice" as const };
  expect(labels(g).map((r) => r.length)).toEqual([5, 5, 5, 4]);
  expect(labels(g)[3]).toEqual(["✏️ Notes", "↩ Undo", "Clear all", "New"]);
  expect(ids(g)).toContain("sudoku:undo:practice");
  expect(ids(g)).toContain("sudoku:mode:practice");
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
  expect(style("✏️ Notes")).toBe(ButtonStyle.Secondary);
  expect(style("↩ Undo")).toBe(ButtonStyle.Secondary);
});

test("in note mode Notes and every digit are primary; the rest unchanged", () => {
  const all = buttons({ ...GAME, noteMode: true }).flatMap((r) => r.components);
  const style = (l: string) => all.find((c) => c.label === l)?.style;

  for (const d of "123456789") expect(style(d)).toBe(ButtonStyle.Primary);

  expect(style("✏️ Notes")).toBe(ButtonStyle.Primary);
  expect(style("Clear")).toBe(ButtonStyle.Secondary);
  expect(style("↩ Undo")).toBe(ButtonStyle.Secondary);
  expect(style("◀")).toBe(ButtonStyle.Secondary);
});

test("a solved daily has no buttons", () => {
  expect(buttons({ ...GAME, solvedAt: 5 })).toEqual([]);
});

test("a solved practice board keeps only New", () => {
  const g = { ...GAME, kind: "practice" as const, solvedAt: 5 };
  expect(labels(g)).toEqual([["New"]]);
  expect(ids(g)).toEqual(["sudoku:new:practice"]);
});

const styleOf = (g: Game, d: string) =>
  buttons(g)
    .flatMap((r) => r.components)
    .find((c) => c.label === d)?.style;

test("a digit placed nine times turns its button green, in either mode", () => {
  const done = { ...GAME, cells: GAME.solution };

  expect(styleOf(done, "5")).toBe(ButtonStyle.Success);
  expect(styleOf({ ...done, noteMode: true }, "5")).toBe(ButtonStyle.Success);
  expect(styleOf(GAME, "5")).toBe(ButtonStyle.Secondary);
});
