import type { Grid } from "../../types.ts";

/** Working state: the cells plus candidate masks (bit d-1 = digit d; 0 for filled cells). */
export interface Board {
  cells: Grid;
  marks: number[];
}

/** Applies one step; true when it placed a digit or removed a candidate. */
export type Technique = (b: Board) => boolean;
