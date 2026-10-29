import { adjacentMines } from "../field.ts";
import { columnLetter } from "../grid.ts";
import type { Board } from "../types.ts";

/** One printed character and its ANSI foreground (0 = default). */
type Glyph = [text: string, colour: number];

const HIDDEN: Glyph = ["■", 0];
const EMPTY: Glyph = ["·", 0];
const FLAG: Glyph = ["⚑", 31];
const MINE: Glyph = ["*", 0];
const HIT: Glyph = ["X", 31];
const WRONG_FLAG: Glyph = ["x", 0];

/** Classic Minesweeper digit colours. */
const COLOURS: Record<number, number> = { 1: 34, 2: 32, 3: 31, 4: 35, 5: 33, 6: 36, 7: 37, 8: 30 };

/** What a finished (lost or given-up) board shows over a cell, if anything. */
function endGlyph(b: Board, field: boolean[], i: number): Glyph | null {
  if (b.result !== "lost" && b.result !== "gave-up") return null;

  if (i === b.hit) return HIT;

  if (field[i]) return MINE;

  return b.cells[i] === "flag" ? WRONG_FLAG : null;
}

function glyph(b: Board, field: boolean[], i: number): Glyph {
  const end = endGlyph(b, field, i);

  if (end) return end;

  if (b.cells[i] === "flag") return FLAG;

  if (b.cells[i] === "hidden") return HIDDEN;

  const n = adjacentMines(field, i, b.width, b.height);

  return n === 0 ? EMPTY : [String(n), COLOURS[n] ?? 0];
}

/** The character before cell `col`: brackets around a live cursor, else a space. */
function separator(b: Board, row: number, col: number): Glyph {
  const at = row * b.width + col;
  const live = b.result === null;

  if (live && at === b.cursor) return ["[", 0];

  if (live && col > 0 && at - 1 === b.cursor) return ["]", 0];

  return [" ", 0];
}

function rowGlyphs(b: Board, field: boolean[], row: number): Glyph[] {
  const out: Glyph[] = [[String(row + 1).padStart(2), 0]];

  for (let col = 0; col < b.width; col++) {
    out.push(separator(b, row, col), glyph(b, field, row * b.width + col));
  }

  const last = (row + 1) * b.width - 1;
  out.push(b.result === null && last === b.cursor ? ["]", 0] : [" ", 0]);

  return out;
}

/** Glyphs as text, switching colour only where a visible character needs another one. */
function paint(lines: Glyph[][]): string {
  let current = 0;

  return lines
    .map((line) =>
      line
        .map(([text, colour]) => {
          if (text.trim() === "" || colour === current) return text;

          current = colour;

          return `\u001b[${colour}m${text}`;
        })
        .join("")
        .trimEnd(),
    )
    .join("\n");
}

/** The board as an ```ansi code block with column letters and row numbers. */
export function renderGrid(b: Board): string {
  const field = b.field ?? [];
  const header: Glyph[] = [["  ", 0]];

  for (let col = 0; col < b.width; col++) header.push([` ${columnLetter(col)}`, 0]);

  const rows = Array.from({ length: b.height }, (_, row) => rowGlyphs(b, field, row));

  return `\`\`\`ansi\n${paint([header, ...rows])}\n\`\`\``;
}
