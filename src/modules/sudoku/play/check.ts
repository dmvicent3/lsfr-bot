import type { Game, Step } from "../types.ts";
import { unchanged } from "./step.ts";

/** True when cell `i` is a filled non-given cell that differs from the solution. */
function isWrong(g: Game, i: number): boolean {
  const c = g.cells[i];

  return g.givens[i] === "0" && c !== "0" && c !== g.solution[i];
}

/** Marks every wrong filled cell and spends one check. */
export function check(g: Game): Step {
  if (g.solvedAt !== null) return unchanged(g);

  const wrong = Array.from({ length: 81 }, (_, i) => (isWrong(g, i) ? "1" : "0")).join("");

  return unchanged({ ...g, wrong, checks: g.checks + 1 });
}
