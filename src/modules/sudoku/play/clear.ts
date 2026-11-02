import type { Game, Step } from "../types.ts";
import { blocked, setChar, unchanged } from "./step.ts";

/** Empties the cursor cell and its wrong mark. */
export function clear(g: Game): Step {
  const stop = blocked(g);

  if (stop) return stop;

  const cells = setChar(g.cells, g.cursor, "0");
  const wrong = setChar(g.wrong, g.cursor, "0");

  return unchanged({ ...g, cells, wrong });
}
