import { setChar } from "./step.ts";

const SIZE = 81 * 9;

/** `notes` at full length: `''` (old rows, new games) reads as no notes. */
const full = (notes: string): string => (notes === "" ? "0".repeat(SIZE) : notes);

/** The digits noted in cell `i`, ascending. */
export function notesOf(notes: string, i: number): number[] {
  const own = full(notes).slice(i * 9, i * 9 + 9);

  return own.split("").flatMap((c, k) => (c === "1" ? [k + 1] : []));
}

/** `notes` with digit `d` in cell `i` flipped. */
export function toggleNote(notes: string, i: number, d: number): string {
  const all = full(notes);
  const at = i * 9 + d - 1;

  return setChar(all, at, all[at] === "1" ? "0" : "1");
}

/** `notes` without cell `i`'s notes; no notes stays `''`. */
export function clearNotes(notes: string, i: number): string {
  if (notes === "") return notes;

  return notes.slice(0, i * 9) + "0".repeat(9) + notes.slice(i * 9 + 9);
}

/** True when cells `a` and `b` share a row, column or 3×3 box. */
const sees = (a: number, b: number): boolean =>
  a % 9 === b % 9 ||
  Math.floor(a / 9) === Math.floor(b / 9) ||
  (Math.floor(a / 27) === Math.floor(b / 27) &&
    Math.floor((a % 9) / 3) === Math.floor((b % 9) / 3));

/** The 20 cells sharing a row, column or box with cell `i`. */
export function peersOf(i: number): number[] {
  return Array.from({ length: 81 }, (_, j) => j).filter((j) => j !== i && sees(i, j));
}

/** `notes` with digit `d` removed from each of `cells`; no notes stays `''`. */
export function dropNote(notes: string, cells: number[], d: number): string {
  if (notes === "") return notes;

  return cells.reduce((n, i) => setChar(n, i * 9 + d - 1, "0"), notes);
}
