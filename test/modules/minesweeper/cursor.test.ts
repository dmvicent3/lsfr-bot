import { describe, expect, test } from "bun:test";
import { canStep, stepCursor } from "../../../src/modules/minesweeper/cursor.ts";
import { game } from "./fixtures.ts";

const THREE = ["...", "...", "..."];

describe("stepCursor", () => {
  test("moves one cell each way", () => {
    const g = game(THREE, { cursor: 4 });
    expect(stepCursor(g, "up").cursor).toBe(1);
    expect(stepCursor(g, "down").cursor).toBe(7);
    expect(stepCursor(g, "left").cursor).toBe(3);
    expect(stepCursor(g, "right").cursor).toBe(5);
  });

  test("stops at the edges", () => {
    expect(stepCursor(game(THREE, { cursor: 0 }), "up").cursor).toBe(0);
    expect(stepCursor(game(THREE, { cursor: 0 }), "left").cursor).toBe(0);
    expect(stepCursor(game(THREE, { cursor: 8 }), "down").cursor).toBe(8);
    expect(stepCursor(game(THREE, { cursor: 5 }), "right").cursor).toBe(5);
  });
});

describe("canStep", () => {
  test("false only where the move would leave the board", () => {
    const corner = game(THREE, { cursor: 2 });
    expect(canStep(corner, "up")).toBe(false);
    expect(canStep(corner, "right")).toBe(false);
    expect(canStep(corner, "down")).toBe(true);
    expect(canStep(corner, "left")).toBe(true);
  });
});
