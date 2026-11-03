import type { Slot } from "../types.ts";

type White = (i: number) => boolean;

function run(start: number, step: number, white: White, wrap: number): number[] {
  const cells: number[] = [];

  for (let i = start; white(i); i += step) {
    cells.push(i);

    if (step === 1 && (i + 1) % wrap === 0) break;
  }

  return cells;
}

function startsAcross(i: number, size: number, white: White): boolean {
  const leftOpen = i % size === 0 || !white(i - 1);
  const rightOpen = i % size < size - 1 && white(i + 1);

  return leftOpen && rightOpen;
}

function startsDown(i: number, size: number, white: White): boolean {
  return !white(i - size) && white(i + size);
}

/** Slots with standard numbering: across ordered by n, then down ordered by n. */
export function slotsOf(size: number, blocks: number[]): Slot[] {
  const black = new Set(blocks);
  const white: White = (i) => i >= 0 && i < size * size && !black.has(i);
  const across: Slot[] = [];
  const down: Slot[] = [];
  let n = 0;

  for (let i = 0; i < size * size; i++) {
    const a = white(i) && startsAcross(i, size, white);
    const d = white(i) && startsDown(i, size, white);

    if (!a && !d) continue;

    n++;

    if (a) across.push({ n, dir: "a", cells: run(i, 1, white, size) });

    if (d) down.push({ n, dir: "d", cells: run(i, size, white, size) });
  }

  return [...across, ...down];
}
