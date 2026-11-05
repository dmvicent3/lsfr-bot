import { ordinal } from "../../../core/ordinal.ts";
import { letterNotes } from "../letters.ts";
import { puzzleNumber } from "../puzzle-date.ts";
import type { LetterNotes, NoteLines, Puzzle } from "../types.ts";

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

/** One answer's notes after `guesses`: the group lines, and the pattern once a letter is placed. */
export function noteLines(guesses: string[], answer: string): NoteLines {
  const n = letterNotes(guesses, answer);
  const pattern = n.pattern.map((c) => (c ? up(c) : "_")).join(" ");

  return { groups: groupLines(n), pattern: n.placed.length > 0 ? `Pattern: \`${pattern}\`` : null };
}

/** The player's letter notes for a puzzle: groups by status, then the placed pattern. */
export function lettersText(v: { puzzle: Puzzle; guesses: string[] }): string {
  const heading = `**Word #${puzzleNumber(v.puzzle.date)}** · letters`;

  if (v.guesses.length === 0) return `${heading}\nNo guesses yet. Guess with \`/word guess\`.`;

  const { groups, pattern } = noteLines(v.guesses, v.puzzle.word);

  return [heading, ...groups, ...(pattern ? ["", pattern] : [])].join("\n");
}
