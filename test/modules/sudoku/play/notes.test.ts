import { expect, test } from "bun:test";
import { clearNotes, notesOf, toggleNote } from "../../../../src/modules/sudoku/play/notes.ts";

const NONE = "0".repeat(729);

test("'' reads as no notes anywhere", () => {
  expect(notesOf("", 0)).toEqual([]);
  expect(notesOf("", 80)).toEqual([]);
});

test("toggle turns a note on at i*9 + d-1, normalising ''", () => {
  const notes = toggleNote("", 2, 5);

  expect(notes).toHaveLength(729);
  expect(notes[2 * 9 + 4]).toBe("1");
  expect(notes.split("").filter((c) => c === "1")).toHaveLength(1);
  expect(notesOf(notes, 2)).toEqual([5]);
});

test("toggle twice turns it off again", () => {
  expect(toggleNote(toggleNote(NONE, 7, 9), 7, 9)).toBe(NONE);
});

test("notes list in ascending order, per cell", () => {
  const notes = [9, 1, 4].reduce((n, d) => toggleNote(n, 10, d), NONE);

  expect(notesOf(notes, 10)).toEqual([1, 4, 9]);
  expect(notesOf(notes, 11)).toEqual([]);
});

test("clear empties one cell's notes only", () => {
  const notes = toggleNote(toggleNote(toggleNote(NONE, 3, 2), 3, 8), 4, 2);
  const cleared = clearNotes(notes, 3);

  expect(notesOf(cleared, 3)).toEqual([]);
  expect(notesOf(cleared, 4)).toEqual([2]);
});

test("clear on '' stays ''", () => {
  expect(clearNotes("", 3)).toBe("");
});
