import { spacedCaps } from "../../../core/spaced.ts";
import { clue } from "../clue/clue.ts";
import { squares } from "./squares.ts";
import type { Shown } from "./types.ts";

/** A guess as the board shows it: spaced capitals, then its emoji. */
export const guessRow = (guess: string, answer: string): string =>
  `${spacedCaps(guess)} ${squares(clue(guess, answer))}`;

/** `_4 earlier guesses not shown_`. */
export const earlierLine = (n: number): string =>
  `_${n} earlier ${n === 1 ? "guess" : "guesses"} not shown_`;

/** The newest `rows` whose lines (each with its line break) fit in `room` characters. */
export function latest(rows: string[], room: number): Shown {
  let used = 0;
  let k = rows.length;

  while (k > 0 && used + rows[k - 1]!.length + 1 <= room) {
    used += rows[k - 1]!.length + 1;
    k--;
  }

  return { shown: rows.slice(k), earlier: k };
}
