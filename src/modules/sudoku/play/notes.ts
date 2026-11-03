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
