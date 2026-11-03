import { peersOf } from "./notes.ts";

/** Filled cells whose digit appears again in the same row, column or box (rule clashes only). */
export function repeats(cells: string): Set<number> {
  const out = new Set<number>();

  for (let i = 0; i < 81; i++) {
    const d = cells[i];

    if (d !== "0" && peersOf(i).some((p) => cells[p] === d)) out.add(i);
  }

  return out;
}
