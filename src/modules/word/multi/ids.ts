import type { Mode } from "./types.ts";

/** Custom IDs `word:<action>:<mode>:<date>`; the date is the puzzle's, so an old board is known. */
const id = (action: string, mode: Mode, date: string): string => `word:${action}:${mode}:${date}`;

/** The Guess button: opens the guess modal. */
export const guessId = (mode: Mode, date: string): string => id("guess", mode, date);

/** The guess modal's submit. */
export const answerId = (mode: Mode, date: string): string => id("answer", mode, date);

export const giveUpId = (mode: Mode, date: string): string => id("giveup", mode, date);

/** The text input inside the guess modal. */
export const GUESS_FIELD = "word";
