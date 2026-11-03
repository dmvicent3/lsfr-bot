import type { Game, Step } from "../types.ts";
import { toggleNote } from "./notes.ts";
import { record } from "./history.ts";
import { blocked, unchanged } from "./step.ts";

const FILLED = "Clear the cell first to add notes.";

/** Toggles note `digit` in the empty cursor cell; the cursor stays. */
export function putNote(g: Game, digit: number): Step {
  const stop = blocked(g);

  if (stop) return stop;

  if (g.cells[g.cursor] !== "0") return unchanged(g, FILLED);

  return unchanged(record(g, { ...g, notes: toggleNote(g.notes, g.cursor, digit) }));
}
