import type { CellState } from "./types.ts";

const TOGGLED: Partial<Record<CellState, CellState>> = { hidden: "flag", flag: "hidden" };

/** Flag ↔ hidden on cell `i`; an open cell is left alone with a hint. */
export function toggleFlag(
  cells: CellState[],
  i: number,
): { cells: CellState[]; hint: string | null } {
  const next = TOGGLED[cells[i] ?? "open"];

  if (!next) return { cells, hint: "That cell is already open." };

  return { cells: cells.map((c, k) => (k === i ? next : c)), hint: null };
}
