import { expect, test } from "bun:test";
import { notesOf, toggleNote } from "../../../../src/modules/sudoku/play/notes.ts";
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

test("put sets the cell, clears wrong and keeps the cursor", () => {
  const g = makeGame({ wrong: setAt("0".repeat(81), 2, "1") });
  const step = put(g, 1);

  expect(step.game.cells[2]).toBe("1");
  expect(step.game.wrong[2]).toBe("0");
  expect(step.game.cursor).toBe(2);
  expect(step.note).toBeNull();
  expect(step.solved).toBe(false);
  expect(g.cells[2]).toBe("0");
});

test("overwriting a filled non-given cell is allowed", () => {
  const g = makeGame({ cells: setAt(makeGame().cells, 2, "5") });

  expect(put(g, 7).game.cells[2]).toBe("7");
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

const NONE = "0".repeat(729);

test("in note mode put toggles that note and the cursor stays", () => {
  const g = makeGame({ noteMode: true });
  const on = put(g, 4);

  expect(notesOf(on.game.notes, 2)).toEqual([4]);
  expect(on.game.cells).toBe(g.cells);
  expect(on.game.cursor).toBe(2);
  expect(on.note).toBeNull();
  expect(notesOf(put(on.game, 4).game.notes, 2)).toEqual([]);
});

test("in note mode a given is refused", () => {
  const g = makeGame({ noteMode: true, cursor: 0 });
  const step = put(g, 4);

  expect(step.game).toBe(g);
  expect(step.note).toBe("That's a given.");
});

test("in note mode a cell holding a digit must be cleared first", () => {
  const g = makeGame({ noteMode: true, cells: setAt(makeGame().cells, 2, "5") });
  const step = put(g, 4);

  expect(step.game).toBe(g);
  expect(step.note).toBe("Clear the cell first to add notes.");
});

test("in note mode a solved game is unchanged", () => {
  const g = makeGame({ noteMode: true, solvedAt: 5 });

  expect(put(g, 4).game).toBe(g);
});

test("placing a digit clears only that cell's notes", () => {
  const notes = toggleNote(toggleNote(toggleNote(NONE, 2, 1), 2, 7), 3, 1);
  const step = put(makeGame({ notes }), 4);

  expect(step.game.cells[2]).toBe("4");
  expect(notesOf(step.game.notes, 2)).toEqual([]);
  expect(notesOf(step.game.notes, 3)).toEqual([1]);
});

test("placing a digit drops it from the row, column and box peers' notes", () => {
  // Cell 2 is row 0, column 2, box 0; cell 80 is no peer.
  const peers = [3, 74, 19];
  const notes = [...peers, 80].reduce((n, i) => toggleNote(toggleNote(n, i, 4), i, 9), NONE);
  const step = put(makeGame({ notes: toggleNote(notes, 2, 1) }), 4);

  for (const i of peers) expect(notesOf(step.game.notes, i)).toEqual([9]);

  expect(notesOf(step.game.notes, 80)).toEqual([4, 9]);
  expect(notesOf(step.game.notes, 2)).toEqual([]);
});

test("placing a digit with no notes keeps notes ''", () => {
  expect(put(makeGame(), 4).game.notes).toBe("");
});
