import { expect, test } from "bun:test";
import { toggleMode } from "../../../../src/modules/sudoku/play/mode.ts";
import { makeGame } from "./game.ts";

test("mode flips note mode both ways and leaves the rest", () => {
  const on = toggleMode(makeGame()).game;

  expect(on.noteMode).toBe(true);
  expect(on.cursor).toBe(2);
  expect(toggleMode(on).game.noteMode).toBe(false);
});

test("mode on a solved game is unchanged", () => {
  const g = makeGame({ solvedAt: 5 });

  expect(toggleMode(g).game).toBe(g);
});
