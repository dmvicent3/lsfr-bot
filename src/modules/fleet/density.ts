import { shipCells } from "./grid.ts";
import type { Sight } from "./sight.ts";
import { type Dir, SIZE } from "./types.ts";

const DIRS: readonly Dir[] = ["across", "down"];

/** Every on-grid line of `size` that crosses no miss or sunk cell. */
function openLines(size: number, blocked: Set<number>): number[][] {
  const lines: number[][] = [];

  for (let start = 0; start < SIZE * SIZE; start++) {
    for (const dir of DIRS) {
      const cells = shipCells(start, size, dir);

      if (cells && !cells.some((c) => blocked.has(c))) lines.push(cells);
    }
  }

  return lines;
}

function addLine(counts: number[], cells: number[], fired: Set<number>): void {
  for (const c of cells) if (!fired.has(c)) counts[c] = (counts[c] ?? 0) + 1;
}

/**
 * For each cell, how many placements of the ships still afloat cover it (fired cells stay 0).
 * With `mustCover`, only placements through at least one of those cells count.
 */
export function placementCounts(s: Sight, mustCover?: number[]): number[] {
  const counts = Array.from({ length: SIZE * SIZE }, () => 0);
  const blocked = new Set([...s.misses, ...s.sunk]);
  const through = mustCover ? new Set(mustCover) : null;

  for (const size of s.afloat) {
    for (const cells of openLines(size, blocked)) {
      if (through && !cells.some((c) => through.has(c))) continue;

      addLine(counts, cells, s.fired);
    }
  }

  return counts;
}
