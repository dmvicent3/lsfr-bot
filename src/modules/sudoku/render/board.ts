import type { Game } from "../types.ts";

const GIVEN = "\u001b[0;37m";
const ENTRY = "\u001b[0;34m";
const WRONG = "\u001b[0;31m";
const RESET = "\u001b[0m";

const rule = (l: string, m: string, r: string): string =>
  `  ${l}${"─".repeat(9)}${m}${"─".repeat(9)}${m}${"─".repeat(9)}${r}`;
const HEADER = "    A  B  C   D  E  F   G  H  I";

/** The digit (or dot) of cell i, coloured by what it is; empty cells are plain. */
function glyph(g: Game, i: number): string {
  const d = g.cells[i] ?? "0";

  if (d === "0") return "·";

  if (g.wrong[i] === "1") return `${WRONG}${d}${RESET}`;

  return `${g.givens[i] === d ? GIVEN : ENTRY}${d}${RESET}`;
}

const cell = (g: Game, i: number): string =>
  i === g.cursor ? `[${glyph(g, i)}]` : ` ${glyph(g, i)} `;

function line(g: Game, r: number): string {
  const boxes = [0, 3, 6].map((c) => [0, 1, 2].map((k) => cell(g, r * 9 + c + k)).join(""));

  return `${r + 1} │${boxes.join("│")}│`;
}

/** The grid as an ansi code block: givens grey, entries blue, checked-wrong red. */
export function renderBoard(g: Game): string {
  const rows = Array.from({ length: 9 }, (_, r) => line(g, r));
  const middle = rule("├", "┼", "┤");
  const body = [...rows.slice(0, 3), middle, ...rows.slice(3, 6), middle, ...rows.slice(6)];

  return ["```ansi", HEADER, rule("┌", "┬", "┐"), ...body, rule("└", "┴", "┘"), "```"].join("\n");
}
