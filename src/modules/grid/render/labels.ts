import { RULES } from "../rules/catalogue.ts";
import type { Grid } from "../types.ts";

export const ROW_LETTERS = ["A", "B", "C"];

/** `A1` for cell index 0 up to `C3` for 8. */
export const cellId = (i: number): string => `${ROW_LETTERS[Math.floor(i / 3)]}${(i % 3) + 1}`;

export const rowLabel = (g: Grid, i: number): string => RULES[g.rows[Math.floor(i / 3)]!].label;

export const colLabel = (g: Grid, i: number): string => RULES[g.cols[i % 3]!].label;
