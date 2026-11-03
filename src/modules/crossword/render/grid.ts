import { solutionOf } from "../play/cells.ts";
import type { Puzzle } from "../types.ts";

const SUPER = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const CONTENT: Record<string, string> = { "#": "█", ".": "·" };

const superscript = (n: number): string =>
  String(n)
    .split("")
    .map((d) => SUPER[Number(d)])
    .join("");

const content = (ch: string): string => CONTENT[ch] ?? ch.toUpperCase();

/**
 * The grid as a code-block body: one row per line, cells joined by a space. Each cell is its
 * clue number in superscript, padded on the left to the puzzle's widest number, then the
 * content, so a number always sits right before its own letter. `reveal` shows the solution
 * in empty cells.
 */
export function gridText(p: Puzzle, cells: string, reveal: boolean): string {
  const numbers = new Map(p.slots.map((s) => [s.cells[0]!, superscript(s.n)]));
  const width = Math.max(0, ...[...numbers.values()].map((n) => n.length));
  const solution = reveal ? solutionOf(p) : cells;

  const cell = (i: number): string => {
    const shown = cells[i] === "." ? solution[i]! : cells[i]!;

    return `${(numbers.get(i) ?? "").padStart(width, " ")}${content(shown)}`;
  };

  return Array.from({ length: p.size }, (_, r) =>
    Array.from({ length: p.size }, (__, c) => cell(r * p.size + c)).join(" "),
  ).join("\n");
}
