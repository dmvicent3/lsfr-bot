/** Custom IDs; `scope` is the puzzle date or "practice", `stamp` the round's startedAt in base 36. */
const id = (action: string, scope: string, stamp: string): string =>
  `snake:${action}:${scope}:${stamp}`;

/** The Guess button; it opens the modal. */
export const guessId = (scope: string, stamp: string): string => id("guess", scope, stamp);

/** The guess modal's submit. */
export const answerId = (scope: string, stamp: string): string => id("answer", scope, stamp);

export const giveUpId = (scope: string, stamp: string): string => id("giveup", scope, stamp);

export const NEW_ID = "snake:new";

/** The modal's one text input. */
export const GUESS_FIELD = "word";
