import { puzzleNumber } from "../../../core/daily.ts";
import { FIRST_MULTI_PUZZLE } from "../puzzle-date.ts";
import { noteLines } from "../render/letters.ts";
import { boardStates } from "./boards.ts";
import { MODES } from "./modes.ts";
import type { BoardState, MultiPuzzle } from "./types.ts";

/** A solved board is its word; an unsolved one its letter notes and pattern. */
function boardNotes(b: BoardState, k: number): string {
  const title = `**Board ${k + 1}**`;

  if (b.solvedAt !== null) return `${title} ✅ ${b.word.toUpperCase()}`;

  const { groups, pattern } = noteLines(b.guesses, b.word);

  return [title, ...groups, ...(pattern ? [pattern] : [])].join("\n");
}

/** The player's letter notes for each board of a Duo or Quad, as classic `/word letters` shows. */
export function multiLettersText(v: { puzzle: MultiPuzzle; guesses: string[] }): string {
  const { mode, date, words } = v.puzzle;
  const heading = `**${MODES[mode].name} #${puzzleNumber(date, FIRST_MULTI_PUZZLE)}** · letters`;

  if (v.guesses.length === 0) return `${heading}\nNo guesses yet. Play with \`/${mode} play\`.`;

  const boards = boardStates(words, v.guesses).map(boardNotes);

  return [heading, boards.join("\n\n")].join("\n");
}
