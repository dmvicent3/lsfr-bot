import { expect, test } from "bun:test";
import { clearAll } from "../../../../src/modules/sudoku/play/clear-all.ts";
import { notesOf, toggleNote } from "../../../../src/modules/sudoku/play/notes.ts";
import { undo } from "../../../../src/modules/sudoku/play/undo.ts";
import { makeGame, setAt } from "./game.ts";

// EASY: cells 0 and 1 are givens, 2 and 3 empty.
const busy = () =>
  makeGame({
    cells: setAt(setAt(makeGame().cells, 2, "4"), 3, "9"),
    wrong: setAt("0".repeat(81), 3, "1"),
    notes: toggleNote("", 5, 7),
    checks: 2,
  });

test("clear all empties every entry, wrong mark and note; givens and checks stay", () => {
  const g = busy();
  const step = clearAll(g);

  expect(step.game.cells).toBe(g.givens);
  expect(step.game.wrong).toBe("0".repeat(81));
  expect(notesOf(step.game.notes, 5)).toEqual([]);
  expect(step.game.checks).toBe(2);
  expect(step.note).toBeNull();
});

test("one undo brings everything back", () => {
  const g = busy();
  const back = undo(clearAll(g).game).game;

  expect(back.cells).toBe(g.cells);
  expect(notesOf(back.notes, 5)).toEqual([7]);
});

test("an untouched board has nothing to clear; a solved one is left alone", () => {
  const fresh = makeGame();

  expect(clearAll(fresh)).toMatchObject({ game: fresh, note: "Nothing to clear." });
  expect(clearAll({ ...busy(), solvedAt: 1 }).note).toBeNull();
});
