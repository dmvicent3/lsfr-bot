import { expect, test } from "bun:test";
import { move } from "../../../../src/modules/sudoku/play/move.ts";
import { makeGame } from "./game.ts";

test("left from 9 wraps to 17", () => {
  const step = move(makeGame({ cursor: 9 }), "left");

  expect(step.game.cursor).toBe(17);
  expect(step.note).toBeNull();
  expect(step.solved).toBe(false);
});

test("right from 17 wraps to 9", () => {
  expect(move(makeGame({ cursor: 17 }), "right").game.cursor).toBe(9);
});

test("up from 3 wraps to 75", () => {
  expect(move(makeGame({ cursor: 3 }), "up").game.cursor).toBe(75);
});

test("down from 75 wraps to 3", () => {
  expect(move(makeGame({ cursor: 75 }), "down").game.cursor).toBe(3);
});

test("plain steps do not mutate the input", () => {
  const g = makeGame({ cursor: 40 });

  expect(move(g, "right").game.cursor).toBe(41);
  expect(move(g, "down").game.cursor).toBe(49);
  expect(g.cursor).toBe(40);
});
