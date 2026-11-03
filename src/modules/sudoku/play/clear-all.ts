import type { Game, Step } from "../types.ts";
import { record } from "./history.ts";
import { unchanged } from "./step.ts";

const NOTHING = "Nothing to clear.";

/** Empties every entry and note (givens stay); one Undo brings it all back. Checks stay spent. */
export function clearAll(g: Game): Step {
  if (g.solvedAt !== null) return unchanged(g);

  const cleared = { ...g, cells: g.givens, wrong: "0".repeat(81), notes: "" };

  if (cleared.cells === g.cells && !g.notes.includes("1")) return unchanged(g, NOTHING);

  return unchanged(record(g, cleared));
}
