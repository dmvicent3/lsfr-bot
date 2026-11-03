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
 * The grid as a code-block body: one row per line, each cell 3 characters (the clue number
 * as superscript digits padded to 2, then the content). `reveal` shows the solution in
 * empty cells.
 */
export function gridText(p: Puzzle, cells: string, reveal: boolean): string {
  const numbers = new Map(p.slots.map((s) => [s.cells[0]!, s.n]));
  const solution = reveal ? solutionOf(p) : cells;

  const cell = (i: number): string => {
    const n = numbers.get(i);
    const shown = cells[i] === "." ? solution[i]! : cells[i]!;

    return `${(n === undefined ? "" : superscript(n)).padEnd(2, " ")}${content(shown)}`;
  };

  return Array.from({ length: p.size }, (_, r) =>
    Array.from({ length: p.size }, (__, c) => cell(r * p.size + c)).join(""),
  ).join("\n");
}
