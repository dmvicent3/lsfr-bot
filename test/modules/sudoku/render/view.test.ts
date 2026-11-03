import { expect, test } from "bun:test";
import { BOARD_FILE, view } from "../../../../src/modules/sudoku/render/view.ts";
import { EASY_SOLUTION } from "../fixtures.ts";
import { GAME } from "./game.ts";

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

test("content is the status line, with buttons and no mentions", () => {
  const v = view(GAME, 5000);
  expect(v.content).toBe("Easy · #3 · 5s · 0 checks · 51 left");
  expect(v.components).toHaveLength(4);
  expect(v.allowedMentions).toEqual({ parse: [] });
});

test("the board is one sudoku.png attachment replacing any previous one", () => {
  const v = view(GAME, 5000);
  expect(BOARD_FILE).toBe("sudoku.png");
  expect(v.files.map((f) => f.name)).toEqual(["sudoku.png"]);
  expect([...(v.files[0]?.attachment.subarray(0, 8) ?? [])]).toEqual(SIGNATURE);
  expect(v.attachments).toEqual([]);
});

test("a solved game with an award lists the parts and the total, and has no buttons", () => {
  const g = { ...GAME, cells: EASY_SOLUTION, solvedAt: 60_000 };
  const v = view(g, 0, { points: 150, parts: ["Solved: 100", "Speed: 50"] });
  expect(v.content.endsWith("\n\nSolved: 100\nSpeed: 50\n**+150 points**")).toBe(true);
  expect(v.components).toEqual([]);
  expect(v.files).toHaveLength(1);
});
