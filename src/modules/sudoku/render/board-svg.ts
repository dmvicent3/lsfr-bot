import { notesOf } from "../play/notes.ts";
import { repeats } from "../play/repeats.ts";
import type { Game } from "../types.ts";
import type { Point, TextStyle } from "./types.ts";

export const CELL = 48;
export const GUTTER = 24;
/** Room past the right and bottom edge for the thick border's outer half. */
const PAD = 4;
const END = GUTTER + 9 * CELL;
const SIDE = END + PAD;

/** Digit colours: givens, the player's entries, entries a check found wrong, and repeats. */
export const COLOURS = {
  given: "#111",
  entry: "#1a5fb4",
  wrong: "#c01c28",
  repeat: "#c01c28",
} as const;

/** Behind a repeated digit, so a rule clash reads apart from a checked-wrong entry. */
export const REPEAT_FILL = "#f8d0d3";

type Kind = keyof typeof COLOURS;

const DIGIT: Record<Kind, TextStyle> = {
  given: { size: 30, fill: COLOURS.given, bold: true },
  entry: { size: 30, fill: COLOURS.entry },
  wrong: { size: 30, fill: COLOURS.wrong },
  repeat: { size: 30, fill: COLOURS.repeat },
};
const LABEL: TextStyle = { size: 14, fill: "#555" };
const NOTE: TextStyle = { size: 12, fill: "#666" };

const text = ({ x, y }: Point, { size, fill, bold }: TextStyle, s: string): string =>
  `<text x="${x}" y="${y}" font-size="${size}"${bold ? ' font-weight="bold"' : ""} text-anchor="middle" fill="${fill}">${s}</text>`;

const corner = (i: number): Point => ({
  x: GUTTER + (i % 9) * CELL,
  y: GUTTER + Math.floor(i / 9) * CELL,
});

/** The centre of column or row k. */
const mid = (k: number): number => GUTTER + k * CELL + CELL / 2;

/** Note centres sit at 1/6, 3/6 and 5/6 of a cell. */
const third = (n: number): number => (CELL / 6) * (1 + 2 * n);

/** Column letters A–I on top, row numbers 1–9 down the left. */
function labels(): string[] {
  const cols = "ABCDEFGHI".split("").map((l, c) => text({ x: mid(c), y: 17 }, LABEL, l));
  const rows = Array.from({ length: 9 }, (_, r) =>
    text({ x: GUTTER / 2, y: mid(r) + 5 }, LABEL, String(r + 1)),
  );

  return [...cols, ...rows];
}

/** One vertical and one horizontal line at offset k: thick on box edges, thin inside. */
function lines(k: number): string {
  const at = GUTTER + k * CELL;
  const stroke = k % 3 === 0 ? 'stroke="#111" stroke-width="3"' : 'stroke="#999" stroke-width="1"';

  return [
    `<line x1="${at}" y1="${GUTTER}" x2="${at}" y2="${END}" ${stroke}/>`,
    `<line x1="${GUTTER}" y1="${at}" x2="${END}" y2="${at}" ${stroke}/>`,
  ].join("");
}

/** Thin lines first so the thick box lines draw over their ends. */
const grid = (): string[] => [1, 2, 4, 5, 7, 8, 0, 3, 6, 9].map(lines);

/** Where note d sits: its 3×3 spot (1 top-left … 9 bottom-right). */
function notePoint({ x, y }: Point, d: number): Point {
  const k = d - 1;

  return { x: x + third(k % 3), y: y + third(Math.floor(k / 3)) + 4 };
}

/** How a filled cell's digit is drawn; a repeated given keeps its bold. */
function style(g: Game, i: number, clash: Set<number>): TextStyle {
  const own = DIGIT[kind(g, i)];

  return clash.has(i) ? { ...own, fill: COLOURS.repeat } : own;
}

/** What a filled cell's digit is. */
function kind(g: Game, i: number): Kind {
  if (g.givens[i] !== "0") return "given";

  return g.wrong[i] === "1" ? "wrong" : "entry";
}

/** A filled cell's digit, coloured by what it is; an empty cell's notes. */
function cell(g: Game, i: number, clash: Set<number>): string {
  const d = g.cells[i] ?? "0";
  const at = corner(i);

  if (d === "0") {
    return notesOf(g.notes, i)
      .map((n) => text(notePoint(at, n), NOTE, String(n)))
      .join("");
  }

  return text({ x: at.x + CELL / 2, y: at.y + 35 }, style(g, i, clash), d);
}

const square = ({ x, y }: Point, fill: string): string =>
  `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" fill="${fill}"/>`;

/**
 * The board as an SVG: repeated digits red on a light-red cell, the cursor cell yellow (drawn
 * over a repeat's fill), givens bold, notes small in empty cells.
 */
export function boardSvg(g: Game): string {
  const clash = repeats(g.cells);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIDE}" height="${SIDE}" viewBox="0 0 ${SIDE} ${SIDE}" font-family="DejaVu Sans">`,
    `<rect width="${SIDE}" height="${SIDE}" fill="#fff"/>`,
    ...[...clash].map((i) => square(corner(i), REPEAT_FILL)),
    square(corner(g.cursor), "#fff3b0"),
    ...grid(),
    ...labels(),
    ...Array.from({ length: 81 }, (_, i) => cell(g, i, clash)),
    "</svg>",
  ].join("");
}
