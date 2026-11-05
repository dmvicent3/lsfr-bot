import { MAX_GUESS, MIN_GUESS } from "../play/validate.ts";
import { guessCount, resultLines } from "./result.ts";
import type { BoardView } from "./types.ts";

/** How to read the board, shown until the first guess. */
export const HOW_TO = [
  `Find the hidden word: 4–10 letters, its length kept secret. Guess any word of ${MIN_GUESS}–${MAX_GUESS} letters, as often as you like.`,
  "🟩 in the word, in the same order as your other greens · 🟨 in the word, elsewhere · ⬛ not in the word (or no copy left)",
  "Greens next to each other in the word join into one bar. A rounded left end: the word starts with that letter. A rounded right end: it ends with it.",
].join("\n");

/** "Snake #3", or "Practice snake". */
export const roundName = (number: number | null): string =>
  number === null ? "Practice snake" : `Snake #${number}`;

/** The first line: the game's name and the guess count. */
export const header = (v: BoardView): string =>
  `**${roundName(v.number)}** · ${guessCount(v.guesses.length)}`;

const earlierLine = (n: number): string =>
  `_${n} earlier ${n === 1 ? "guess" : "guesses"} not shown_`;

/** What follows the picture: the guesses left out of it, then the result once finished. */
export function body(v: BoardView, earlier: number): string {
  const head = earlier > 0 ? [earlierLine(earlier)] : [];
  const intro = v.guesses.length === 0 && !v.finished ? [HOW_TO] : [];

  return [...intro, ...head, ...resultLines(v)].join("\n");
}
