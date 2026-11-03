import { BLOCK, EMPTY_CELL, isRevealed, solutionOf, wrongOrEmpty } from "../play/cells.ts";
import type { Puzzle } from "../types.ts";

export const CELL = 64;
export const MARGIN = 4;
const INK = "#111";
const NUMBER_INK = "#333";

/** Letter colours: typed, revealed, and the solution shown where a give-up left a cell wrong. */
export const COLOURS = { typed: INK, revealed: "#1a5fb4", missed: "#c01c28" } as const;

type Shade = keyof typeof COLOURS;

const at = (p: Puzzle, i: number) => ({
  x: MARGIN + (i % p.size) * CELL,
  y: MARGIN + Math.floor(i / p.size) * CELL,
});

const square = (x: number, y: number, block: boolean): string =>
  `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" fill="${block ? INK : "#fff"}" stroke="${INK}" stroke-width="2"/>`;

const number = (x: number, y: number, n: number): string =>
  `<text x="${x + 5}" y="${y + 17}" font-size="15" fill="${NUMBER_INK}">${n}</text>`;

const letter = (x: number, y: number, ch: string, shade: Shade): string =>
  `<text x="${x + CELL / 2}" y="${y + 0.78 * CELL}" font-size="36" font-weight="bold" text-anchor="middle" fill="${COLOURS[shade]}">${ch.toUpperCase()}</text>`;

/** What a cell shows: its letter and colour, or nothing for an empty cell. */
function shown(
  cells: string,
  i: number,
  finished: { solution: string; missed: Set<number> } | null,
): { ch: string; shade: Shade } | null {
  const ch = cells[i]!;

  if (finished?.missed.has(i)) return { ch: finished.solution[i]!, shade: "missed" };

  if (ch === EMPTY_CELL) return null;

  return { ch, shade: isRevealed(ch) ? "revealed" : "typed" };
}

/**
 * The grid as an SVG: blocks filled, clue numbers top-left, typed letters dark, revealed ones
 * blue. Finished, every white cell shows its solution, red where it was empty or wrong.
 */
export function gridSvg(p: Puzzle, cells: string, finished: boolean): string {
  const side = MARGIN * 2 + CELL * p.size;
  const numbers = new Map(p.slots.map((s) => [s.cells[0]!, s.n]));
  const end = finished
    ? { solution: solutionOf(p), missed: new Set(wrongOrEmpty(p, cells)) }
    : null;
  const parts = cells.split("").map((c, i) => {
    const { x, y } = at(p, i);

    if (c === BLOCK) return square(x, y, true);

    const n = numbers.get(i);
    const s = shown(cells, i, end);

    return [
      square(x, y, false),
      n ? number(x, y, n) : "",
      s ? letter(x, y, s.ch, s.shade) : "",
    ].join("");
  });

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}" viewBox="0 0 ${side} ${side}" font-family="DejaVu Sans">`,
    `<rect width="${side}" height="${side}" fill="#fff"/>`,
    ...parts,
    "</svg>",
  ].join("");
}
