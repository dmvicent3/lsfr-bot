import type { Direction, Game, Step } from "../types.ts";
import { unchanged } from "./step.ts";

/** Column and row change of one step. */
const DELTAS: Record<Direction, [dc: number, dr: number]> = {
  left: [-1, 0],
  right: [1, 0],
  up: [0, -1],
  down: [0, 1],
};

/** The cursor one cell that way, wrapping within its row or column. */
export function move(g: Game, dir: Direction): Step {
  const [dc, dr] = DELTAS[dir];
  const col = ((((g.cursor % 9) + dc) % 9) + 9) % 9;
  const row = (((Math.floor(g.cursor / 9) + dr) % 9) + 9) % 9;

  return unchanged({ ...g, cursor: row * 9 + col });
}
