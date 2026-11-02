import type { Game, Step } from "../types.ts";
import { nextEmpty } from "./next-empty.ts";
import { blocked, setChar, unchanged } from "./step.ts";

const FULL_WRONG = "Grid is full but something's off.";

/** Writes a digit at the cursor, then jumps on or reports the full grid. */
export function put(g: Game, digit: number): Step {
  const stop = blocked(g);

  if (stop) return stop;

  const cells = setChar(g.cells, g.cursor, String(digit));
  const wrong = setChar(g.wrong, g.cursor, "0");
  const full = !cells.includes("0");

  if (full && cells === g.solution) {
    return { game: { ...g, cells, wrong }, note: null, solved: true };
  }

  const cursor = full ? g.cursor : nextEmpty(cells, g.cursor);

  return unchanged({ ...g, cells, wrong, cursor }, full ? FULL_WRONG : null);
}
