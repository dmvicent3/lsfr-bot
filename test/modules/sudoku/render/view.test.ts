import { expect, test } from "bun:test";
import { renderBoard } from "../../../../src/modules/sudoku/render/board.ts";
import { view } from "../../../../src/modules/sudoku/render/view.ts";
import { EASY_SOLUTION } from "../fixtures.ts";
import { GAME } from "./game.ts";

test("content is the board then the status, with buttons and no mentions", () => {
  const v = view(GAME, 5000);
  expect(v.content.startsWith(renderBoard(GAME))).toBe(true);
  expect(v.content).toContain("\nEasy · #3 · 5s · 0 checks ·");
  expect(v.components).toHaveLength(3);
  expect(v.allowedMentions).toEqual({ parse: [] });
});

test("a solved game with an award lists the parts and the total, and has no buttons", () => {
  const g = { ...GAME, cells: EASY_SOLUTION, solvedAt: 60_000 };
  const v = view(g, 0, { points: 150, parts: ["Solved: 100", "Speed: 50"] });
  expect(v.content.endsWith("\n\nSolved: 100\nSpeed: 50\n**+150 points**")).toBe(true);
  expect(v.components).toEqual([]);
});
