import { adjacentMines } from "../field.ts";
import type { Setup } from "../types.ts";
import { zeroFlood } from "./flood.ts";
import type { DailyMap } from "./types.ts";

/** The pre-opened region every daily starts with is at least this big. */
export const MIN_OPENING = 9;

/** Mines uniform over the whole board: no safe first cell, the opening makes the start fair. */
function layAnywhere(setup: Setup, random: () => number): boolean[] {
  const cells = Array.from({ length: setup.width * setup.height }, (_, i) => i);
  const field = cells.map(() => false);

  for (let k = 0; k < setup.mines; k++) {
    const pick = k + Math.floor(random() * (cells.length - k));
    [cells[k], cells[pick]] = [cells[pick] ?? 0, cells[k] ?? 0];
    field[cells[k] ?? 0] = true;
  }

  return field;
}

/** The zero cell with the largest flood, the smallest index on a tie; null when there is none. */
function bestOpening(field: boolean[], setup: Setup): { opening: number; open: number[] } | null {
  const { width, height } = setup;
  const covered = new Set<number>();
  let best: { opening: number; open: number[] } | null = null;

  for (let i = 0; i < field.length; i++) {
    if (field[i] || covered.has(i) || adjacentMines(field, i, width, height) !== 0) continue;

    const open = zeroFlood(field, i, width, height);
    open.forEach((c) => covered.add(c));

    if (!best || open.length > best.open.length) best = { opening: i, open };
  }

  return best;
}

/** The day's map for a level: drawn from `random` until it has a big enough opening. */
export function dailyMap(setup: Setup, random: () => number): DailyMap {
  for (;;) {
    const field = layAnywhere(setup, random);
    const best = bestOpening(field, setup);

    if (best && best.open.length >= MIN_OPENING) return { field, ...best };
  }
}
