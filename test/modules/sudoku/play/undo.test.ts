import { expect, test } from "bun:test";
import { check } from "../../../../src/modules/sudoku/play/check.ts";
import { move } from "../../../../src/modules/sudoku/play/move.ts";
import { notesOf, toggleNote } from "../../../../src/modules/sudoku/play/notes.ts";
import { put } from "../../../../src/modules/sudoku/play/put.ts";
import { undo } from "../../../../src/modules/sudoku/play/undo.ts";
import { almostSolved, makeGame } from "./game.ts";

test("undo with no history is unchanged with a note", () => {
  const g = makeGame();
  const step = undo(g);

  expect(step.game).toBe(g);
  expect(step.note).toBe("Nothing to undo.");
  expect(step.solved).toBe(false);
});

test("undo restores cells, notes and cursor and pops one snapshot", () => {
  const notes = toggleNote("", 3, 4);
  const g = makeGame({ notes });
  const placed = move(put(g, 4).game, "down").game;
  const step = undo(placed);

  expect(step.game.cells).toBe(g.cells);
  expect(notesOf(step.game.notes, 3)).toEqual([4]);
  expect(step.game.cursor).toBe(2);
  expect(step.game.history).toBe("");
  expect(step.note).toBeNull();
  expect(step.solved).toBe(false);
});

test("undo steps back one edit at a time", () => {
  const one = put(makeGame(), 4).game;
  const two = put({ ...one, cursor: 3 }, 6).game;
  const back = undo(two).game;

  expect(back.cells).toBe(one.cells);
  expect(undo(back).game.cells).toBe(makeGame().cells);
});

test("wrong marks stay on unchanged cells and go on changed ones; checks stay", () => {
  // Cells 2 and 3 get wrong digits and a check marks both; undo takes back cell 3's digit.
  const wrongs = put({ ...put(makeGame(), 1).game, cursor: 3 }, 1).game;
  const checked = check(wrongs).game;
  const step = undo(checked);

  expect(checked.wrong.slice(2, 4)).toBe("11");
  expect(step.game.cells[3]).toBe("0");
  expect(step.game.wrong[2]).toBe("1");
  expect(step.game.wrong[3]).toBe("0");
  expect(step.game.checks).toBe(1);
});

test("undo on a solved game does nothing", () => {
  const g = { ...put(makeGame(), 4).game, solvedAt: 5 };

  expect(undo(g).game).toBe(g);
});

test("undo never solves", () => {
  const g = almostSolved();
  const wrong = put(g, (Number(g.solution[40]) % 9) + 1).game;

  expect(undo(wrong).solved).toBe(false);
});
