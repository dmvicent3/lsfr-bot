import type { Dir, Slot } from "../types.ts";

export const DIR_NAME: Record<Dir, string> = { a: "Across", d: "Down" };

/** `6 Across (5)`. */
export const slotLabel = (s: Slot): string => `${s.n} ${DIR_NAME[s.dir]} (${s.cells.length})`;

/** `m:ss`. */
export function clock(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000);

  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
