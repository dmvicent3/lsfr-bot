import { ordinal } from "../../../core/ordinal.ts";
import { letterNotes } from "../letters.ts";
import { puzzleNumber } from "../puzzle-date.ts";
import type { LetterNotes, Puzzle } from "../types.ts";

const up = (c: string): string => c.toUpperCase();
const spots = (ps: number[]): string => ps.map((p) => ordinal(p + 1)).join(", ");

function groupLines(n: LetterNotes): string[] {
  const groups: [string, string[], string][] = [
    ["🟩", n.placed.map((p) => `${up(p.letter)} (${spots(p.positions)})`), " · "],
    ["🟨", n.near.map((x) => `${up(x.letter)} — not ${spots(x.notAt)}`), " · "],
    ["⬜", n.untried.map(up), " "],
    ["⬛", n.out.map(up), " "],
  ];

  return groups
    .filter(([, items]) => items.length > 0)
    .map(([sq, items, sep]) => `${sq} ${items.join(sep)}`);
}

/** The player's letter notes for a puzzle: groups by status, then the placed pattern. */
export function lettersText(v: { puzzle: Puzzle; guesses: string[] }): string {
  const heading = `**Word #${puzzleNumber(v.puzzle.date)}** · letters`;

  if (v.guesses.length === 0) return `${heading}\nNo guesses yet. Guess with \`/word guess\`.`;

  const n = letterNotes(v.guesses, v.puzzle.word);
  const lines = [heading, ...groupLines(n)];

  if (n.placed.length === 0) return lines.join("\n");

  const pattern = n.pattern.map((c) => (c ? up(c) : "_")).join(" ");

  return [...lines, "", `Pattern: \`${pattern}\``].join("\n");
}
