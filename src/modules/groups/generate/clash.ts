/** `berries` is the plural of `berry`. */
const iesPlural = (a: string, b: string): boolean =>
  a.endsWith("ies") && a.slice(0, -3) + "y" === b;

/** Two board words too alike: one contains the other (so also `-s`/`-es` plurals), or `-ies`. */
export const clashes = (a: string, b: string): boolean =>
  a.includes(b) || b.includes(a) || iesPlural(a, b) || iesPlural(b, a);

/** `word` clashes with none of `board`. */
export const fits = (word: string, board: readonly string[]): boolean =>
  board.every((w) => !clashes(word, w));
