import { expect, test } from "bun:test";
import { clear } from "../../../../src/modules/sudoku/play/clear.ts";
import { notesOf, toggleNote } from "../../../../src/modules/sudoku/play/notes.ts";
import { makeGame, setAt } from "./game.ts";

test("clear empties the cell and its wrong mark, cursor stays", () => {
  const g = makeGame({
    cells: setAt(makeGame().cells, 2, "5"),
    wrong: setAt("0".repeat(81), 2, "1"),
  });
  const step = clear(g);

  expect(step.game.cells[2]).toBe("0");
  expect(step.game.wrong[2]).toBe("0");
  expect(step.game.cursor).toBe(2);
  expect(step.note).toBeNull();
});

test("clear on a given does nothing", () => {
  const g = makeGame({ cursor: 0 });
  const step = clear(g);

  expect(step.game).toBe(g);
  expect(step.note).toBe("That's a given.");
});

test("clear on a solved game does nothing", () => {
  const g = makeGame({ solvedAt: 1 });
  const step = clear(g);

  expect(step.game).toBe(g);
  expect(step.note).toBeNull();
});

test("clear on an empty cell with notes clears its notes", () => {
  const notes = toggleNote(toggleNote("", 2, 3), 3, 3);
  const step = clear(makeGame({ notes }));

  expect(notesOf(step.game.notes, 2)).toEqual([]);
  expect(notesOf(step.game.notes, 3)).toEqual([3]);
  expect(step.game.cells).toBe(makeGame().cells);
});
