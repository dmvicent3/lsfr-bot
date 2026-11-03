import type { Game, Step } from "../types.ts";
import { clearNotes } from "./notes.ts";
import { blocked, setChar, unchanged } from "./step.ts";

/** Empties the cursor cell and its wrong mark; an already empty cell loses its notes. */
export function clear(g: Game): Step {
  const stop = blocked(g);

  if (stop) return stop;

  const cells = setChar(g.cells, g.cursor, "0");
  const wrong = setChar(g.wrong, g.cursor, "0");
  const notes = g.cells[g.cursor] === "0" ? clearNotes(g.notes, g.cursor) : g.notes;

  return unchanged({ ...g, cells, wrong, notes });
}
