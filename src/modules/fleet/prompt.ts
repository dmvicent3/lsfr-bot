import type { JevQuestion } from "../../core/jev/types.ts";
import { placementCounts } from "./density.ts";
import { cellName, neighbours } from "./grid.ts";
import type { Sight } from "./sight.ts";
import { lineFrom } from "./target.ts";
import { SIZE } from "./types.ts";

const HEADER =
  'Hidden fleet: jevos fires at the player\'s 10×10 grid (columns A-J, rows 1-10). "." is unknown, "x" a hit on a ship not yet sunk, "o" a miss, "#" a sunk ship:';

function mark(s: Sight, sets: { wounded: Set<number>; sunk: Set<number> }, c: number): string {
  if (sets.wounded.has(c)) return "x";

  if (sets.sunk.has(c)) return "#";

  return s.fired.has(c) ? "o" : ".";
}

function gridText(s: Sight): string[] {
  const sets = { wounded: new Set(s.wounded), sunk: new Set(s.sunk) };
  const row = (r: number) =>
    Array.from({ length: SIZE }, (_, c) => mark(s, sets, r * SIZE + c)).join(" ");

  return [
    "   A B C D E F G H I J",
    ...Array.from({ length: SIZE }, (_, r) => `${String(r + 1).padStart(2)} ${row(r)}`),
  ];
}

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? "" : "s"}`;

function fact(s: Sight, counts: number[], c: number): string {
  const wounded = new Set(s.wounded);
  const near = neighbours(c).some((n) => wounded.has(n)) ? "next to a hit" : "not next to a hit";
  const line = lineFrom(c, wounded);

  return `${cellName(c)}: ${near}, in line with ${plural(line, "hit")}, ${plural(counts[c] ?? 0, "way")} a ship fits`;
}

/** jevos's evidence: the grid of its shots, the ships afloat, then facts per candidate. */
export function evidence(s: Sight, cells: number[]): string {
  const counts = placementCounts(s);

  return [
    HEADER,
    ...gridText(s),
    `Ships afloat: ${s.afloat.join(", ")}`,
    "",
    "Facts per cell:",
    ...cells.map((c) => fact(s, counts, c)),
  ].join("\n");
}

/** One yes/no question per candidate, keyed by the cell's name. */
export const questions = (cells: number[]): JevQuestion[] =>
  cells.map((c) => ({
    key: cellName(c),
    instructions: `Should jevos fire at ${cellName(c)}? Prefer cells in line with hits, then next to a hit, then the most ways a ship fits.`,
  }));
