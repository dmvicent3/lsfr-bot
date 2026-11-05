import { roundedPath } from "./shape.ts";
import type { Bar, Line } from "./types.ts";

export const TILE = 52;
const GAP = 6;
const ROW_GAP = 10;
const MARGIN = 16;
/** Room left of the tiles for the guess numbers. */
const NUMBERS = 40;
/** The picture is never narrower than this many tiles. */
const MIN_TILES = 5;
const CORNER = 8;
const BACKGROUND = "#1e2024";
const NUMBER_INK = "#8b9099";

/** Tile colours; the letters are white on all three. */
export const FILL = { green: "#3d9a5b", yellow: "#c29a1f", dark: "#3c3f46" } as const;

const xOf = (k: number): number => MARGIN + NUMBERS + k * (TILE + GAP);

function bar(b: Bar, y: number): string {
  const x = xOf(b.from);
  const w = xOf(b.to) + TILE - x;
  const left = b.capStart ? TILE / 2 : CORNER;
  const right = b.capEnd ? TILE / 2 : CORNER;

  return `<path d="${roundedPath({ x, y, w, h: TILE, left, right })}" fill="${FILL[b.colour]}"/>`;
}

const letter = (ch: string, k: number, y: number): string =>
  `<text x="${xOf(k) + TILE / 2}" y="${y + TILE * 0.7}" font-size="28" font-weight="bold" text-anchor="middle" fill="#fff">${ch.toUpperCase()}</text>`;

const number = (n: number, y: number): string =>
  `<text x="${MARGIN + NUMBERS - 12}" y="${y + TILE * 0.64}" font-size="18" text-anchor="end" fill="${NUMBER_INK}">${n}</text>`;

function row(line: Line, r: number): string {
  const y = MARGIN + r * (TILE + ROW_GAP);
  const letters = line.letters.split("").map((ch, k) => letter(ch, k, y));

  return [number(line.n, y), ...line.bars.map((b) => bar(b, y)), ...letters].join("");
}

/** The guess rows as an SVG, oldest at the top: numbers on the left, then the tiles. */
export function boardSvg(lines: Line[]): string {
  const tiles = Math.max(MIN_TILES, ...lines.map((l) => l.letters.length));
  const width = xOf(tiles) - GAP + MARGIN;
  const height = MARGIN * 2 + lines.length * (TILE + ROW_GAP) - ROW_GAP;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="DejaVu Sans">`,
    `<rect width="${width}" height="${height}" fill="${BACKGROUND}"/>`,
    ...lines.map(row),
    "</svg>",
  ].join("");
}
