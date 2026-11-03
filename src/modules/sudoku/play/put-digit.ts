import type { Game, Step } from "../types.ts";
import { clearNotes } from "./notes.ts";
import { blocked, setChar, unchanged } from "./step.ts";

const FULL_WRONG = "Grid is full but something's off.";

/** Writes a digit at the cursor (dropping its notes), keeping the cursor there; reports a full wrong grid. */
export function putDigit(g: Game, digit: number): Step {
  const stop = blocked(g);

  if (stop) return stop;

  const cells = setChar(g.cells, g.cursor, String(digit));
  const wrong = setChar(g.wrong, g.cursor, "0");
  const notes = clearNotes(g.notes, g.cursor);
  const full = !cells.includes("0");

  if (full && cells === g.solution) {
    return { game: { ...g, cells, wrong, notes }, note: null, solved: true };
  }

  return unchanged({ ...g, cells, wrong, notes }, full ? FULL_WRONG : null);
}
