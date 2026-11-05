/** Custom IDs; `scope` is the puzzle date or "practice", `stamp` the round's startedAt in base 36. */
const id = (action: string, scope: string, stamp: string): string =>
  `groups:${action}:${scope}:${stamp}`;

export const pickId = (scope: string, stamp: string, word: number): string =>
  `${id("pick", scope, stamp)}:${word}`;

export const submitId = (scope: string, stamp: string): string => id("submit", scope, stamp);

export const shuffleId = (scope: string, stamp: string): string => id("shuffle", scope, stamp);

export const clearId = (scope: string, stamp: string): string => id("clear", scope, stamp);

export const giveUpId = (scope: string, stamp: string): string => id("giveup", scope, stamp);

export const NEW_ID = "groups:new";

/** The word index (0–15) a `groups:pick` id part names; null when it is not one. */
export function wordIndexOf(part: string | undefined): number | null {
  if (!part || !/^\d{1,2}$/.test(part)) return null;

  const word = Number(part);

  return word < 16 ? word : null;
}
