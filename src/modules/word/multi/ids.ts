import type { Mode } from "./types.ts";

/**
 * Custom IDs `word:<action>:<mode>:<date>`; the date is the puzzle's, so an old board is known.
 * Boards drawn before `/duo guess` also carry `word:guess` (a Guess button) and `word:answer`
 * (its modal); their handlers still answer them.
 */
const id = (action: string, mode: Mode, date: string): string => `word:${action}:${mode}:${date}`;

export const giveUpId = (mode: Mode, date: string): string => id("giveup", mode, date);

/** The text input inside the old guess modal. */
export const GUESS_FIELD = "word";
