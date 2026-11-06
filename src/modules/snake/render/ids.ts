/**
 * Custom IDs; `scope` is the puzzle date or "practice", `stamp` the round's startedAt in base 36.
 * Boards drawn before `/snake guess` also carry `snake:guess` (a Guess button) and `snake:answer`
 * (its modal); their handlers still answer them.
 */
const id = (action: string, scope: string, stamp: string): string =>
  `snake:${action}:${scope}:${stamp}`;

export const giveUpId = (scope: string, stamp: string): string => id("giveup", scope, stamp);

export const NEW_ID = "snake:new";

/** The old guess modal's one text input. */
export const GUESS_FIELD = "word";
