import { expect, test } from "bun:test";
import { put } from "../../../../src/modules/sudoku/play/put.ts";
import { EASY_SOLUTION } from "../fixtures.ts";
import { almostSolved, makeGame, setAt } from "./game.ts";

// EASY: cells 2 and 3 are empty (solution 4 and 6); cell 0 is a given.
test("put on a given is unchanged with a note", () => {
  const g = makeGame({ cursor: 0 });
  const step = put(g, 9);

  expect(step.game).toBe(g);
  expect(step.note).toBe("That's a given.");
  expect(step.solved).toBe(false);
});

test("put sets the cell, clears wrong and jumps to the next empty", () => {
  const g = makeGame({ wrong: setAt("0".repeat(81), 2, "1") });
  const step = put(g, 1);

  expect(step.game.cells[2]).toBe("1");
  expect(step.game.wrong[2]).toBe("0");
  expect(step.game.cursor).toBe(3);
  expect(step.note).toBeNull();
  expect(step.solved).toBe(false);
  expect(g.cells[2]).toBe("0");
});

test("overwriting a filled non-given cell is allowed", () => {
  const g = makeGame({ cells: setAt(makeGame().cells, 2, "5") });

  expect(put(g, 7).game.cells[2]).toBe("7");
});

test("wraps from 80 to the first empty", () => {
  const givens = setAt(makeGame().givens, 80, "0");
  const step = put(makeGame({ givens, cells: givens, cursor: 80 }), 9);

  expect(step.game.cursor).toBe(2);
});

test("last correct put solves and keeps the cursor", () => {
  const step = put(almostSolved(), Number(EASY_SOLUTION[40]));

  expect(step.solved).toBe(true);
  expect(step.note).toBeNull();
  expect(step.game.solvedAt).toBeNull();
  expect(step.game.cursor).toBe(40);
});

test("last wrong put notes the full grid, checks unchanged", () => {
  const wrong = (Number(EASY_SOLUTION[40]) % 9) + 1;
  const step = put(almostSolved(), wrong);

  expect(step.solved).toBe(false);
  expect(step.note).toBe("Grid is full but something's off.");
  expect(step.game.checks).toBe(0);
  expect(step.game.cursor).toBe(40);
});

test("a later put on a full wrong grid still notes it", () => {
  const wrong = (Number(EASY_SOLUTION[40]) % 9) + 1;
  const full = put(almostSolved(), wrong).game;

  expect(put(full, wrong).note).toBe("Grid is full but something's off.");
});

test("put on a solved game is unchanged", () => {
  const g = makeGame({ solvedAt: 5 });
  const step = put(g, 1);

  expect(step.game).toBe(g);
  expect(step.note).toBeNull();
  expect(step.solved).toBe(false);
});
