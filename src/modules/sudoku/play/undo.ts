import type { Game, Step } from "../types.ts";
import { pop } from "./history.ts";
import { unchanged } from "./step.ts";

const NOTHING = "Nothing to undo.";

/** `wrong` kept where the cell's value stays, cleared where it changes. */
const keepWrong = (wrong: string, from: string, to: string): string =>
  Array.from(wrong, (w, i) => (from[i] === to[i] ? w : "0")).join("");

/** Goes back to the board before the last edit; checks and points stay spent. */
export function undo(g: Game): Step {
  if (g.solvedAt !== null) return unchanged(g);

  const last = pop(g.history);

  if (!last) return unchanged(g, NOTHING);

  const { cells, notes, cursor } = last.snapshot;
  const wrong = keepWrong(g.wrong, g.cells, cells);

  return unchanged({ ...g, cells, notes, cursor, wrong, history: last.history });
}
