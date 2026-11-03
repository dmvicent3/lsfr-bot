import type { Game, Step } from "../types.ts";
import { unchanged } from "./step.ts";

/** Flips between placing digits and noting them. */
export function toggleMode(g: Game): Step {
  if (g.solvedAt !== null) return unchanged(g);

  return unchanged({ ...g, noteMode: !g.noteMode });
}
