import { colOf, rowOf } from "../grid.ts";
import { SIZE } from "../types.ts";
import type { Mark } from "./marks.ts";
import type { GridPaint, Point, TextStyle } from "./types.ts";

export const CELL = 30;

/** Cell fills, keeping the old emoji meanings (🟦 ⬜ 💥 🟥 🟨). */
export const COLOURS = {
  water: "#3d8fd1",
  ship: "#c0c4c8",
  hit: "#f08a24",
  sunk: "#c01c28",
  cursor: "#f5c211",
  line: "#0b3d5c",
} as const;

const FILL: Record<Mark, string> = {
  water: COLOURS.water,
  miss: COLOURS.water,
  ship: COLOURS.ship,
  hit: COLOURS.hit,
  sunk: COLOURS.sunk,
};

const LABEL: TextStyle = { size: 13, fill: "#555" };

export const text = ({ x, y }: Point, { size, fill, bold }: TextStyle, s: string): string =>
  `<text x="${x}" y="${y}" font-size="${size}"${bold ? ' font-weight="bold"' : ""} text-anchor="middle" fill="${fill}">${s}</text>`;

const corner = (at: Point, c: number): Point => ({
  x: at.x + colOf(c) * CELL,
  y: at.y + rowOf(c) * CELL,
});

const square = ({ x, y }: Point, paint: string): string =>
  `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" ${paint}/>`;

/** A ✕ of two strokes, 8 px in from the cell's edges. */
function cross({ x, y }: Point, colour: string): string {
  const stroke = `stroke="${colour}" stroke-width="2.5" stroke-linecap="round"`;

  return [
    `<line x1="${x + 8}" y1="${y + 8}" x2="${x + 22}" y2="${y + 22}" ${stroke}/>`,
    `<line x1="${x + 22}" y1="${y + 8}" x2="${x + 8}" y2="${y + 22}" ${stroke}/>`,
  ].join("");
}

/** What a shot leaves on its cell: a white dot for a miss, a dark ✕ for a hit, white when sunk. */
const SYMBOL: Partial<Record<Mark, (p: Point) => string>> = {
  miss: ({ x, y }) => `<circle cx="${x + CELL / 2}" cy="${y + CELL / 2}" r="5" fill="#fff"/>`,
  hit: (p) => cross(p, "#3b1d00"),
  sunk: (p) => cross(p, "#fff"),
};

/** The centre of column or row k, from the grid edge. */
const mid = (k: number): number => k * CELL + CELL / 2;

/** Column letters A–J above the grid, row numbers 1–10 down its left. */
function labels(at: Point): string[] {
  const cols = "ABCDEFGHIJ"
    .split("")
    .map((l, c) => text({ x: at.x + mid(c), y: at.y - 6 }, LABEL, l));
  const rows = Array.from({ length: SIZE }, (_, r) =>
    text({ x: at.x - 10, y: at.y + mid(r) + 5 }, LABEL, String(r + 1)),
  );

  return [...cols, ...rows];
}

function lines(at: Point): string[] {
  const end = SIZE * CELL;
  const stroke = `stroke="${COLOURS.line}" stroke-width="1"`;

  return Array.from({ length: SIZE + 1 }, (_, k) => {
    const v = `<line x1="${at.x + k * CELL}" y1="${at.y}" x2="${at.x + k * CELL}" y2="${at.y + end}" ${stroke}/>`;
    const h = `<line x1="${at.x}" y1="${at.y + k * CELL}" x2="${at.x + end}" y2="${at.y + k * CELL}" ${stroke}/>`;

    return v + h;
  });
}

/** One 10×10 grid with its labels: cell fills, preview, lines, shot symbols, then the cursor. */
export function gridSvg(p: GridPaint): string {
  const cells = Array.from({ length: SIZE * SIZE }, (_, c) => c);
  const at = (c: number) => corner(p.at, c);
  const preview = `fill="${COLOURS.cursor}" fill-opacity="1"`;
  const outline = `fill="none" stroke="${COLOURS.cursor}" stroke-width="3"`;

  return [
    ...cells.map((c) => square(at(c), `fill="${FILL[p.mark(c)]}"`)),
    ...[...p.preview].map((c) => square(at(c), preview)),
    ...lines(p.at),
    ...cells.map((c) => SYMBOL[p.mark(c)]?.(at(c)) ?? ""),
    ...labels(p.at),
    p.cursor === null ? "" : square(at(p.cursor), outline),
  ].join("");
}
