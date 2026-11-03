import type { Game, Step } from "../types.ts";
import { clearNotes, dropNote, peersOf } from "./notes.ts";
import { record } from "./history.ts";
import { blocked, setChar, unchanged } from "./step.ts";

const FULL_WRONG = "Grid is full but something's off.";

/**
 * Writes a digit at the cursor, dropping its notes and that digit's notes in its peers, keeping the
 * cursor there; reports a full wrong grid.
 */
export function putDigit(g: Game, digit: number): Step {
  const stop = blocked(g);

  if (stop) return stop;

  const cells = setChar(g.cells, g.cursor, String(digit));
  const wrong = setChar(g.wrong, g.cursor, "0");
  const notes = dropNote(clearNotes(g.notes, g.cursor), peersOf(g.cursor), digit);
  const full = !cells.includes("0");

  const game = record(g, { ...g, cells, wrong, notes });

  if (full && cells === g.solution) return { game, note: null, solved: true };

  return unchanged(game, full ? FULL_WRONG : null);
}
