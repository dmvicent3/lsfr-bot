/** A WordNet gloss is the definition, then `;`-separated extras and quoted examples. */
export const glossOf = (raw: string): string => (raw.split(/[;"]/)[0] ?? "").trim();

const OFFENSIVE = /offensive|slur|vulgar|obscene|disparag|derogator/i;
const SHORT = 90;

/** What a clue shows of a gloss: no leading "(…) " note. */
const shown = (gloss: string): string => gloss.replace(/^\([^)]*\)\s*/, "");

/** A sense WordNet marks as offensive, vulgar or disparaging. */
export const isOffensive = (gloss: string): boolean => OFFENSIVE.test(gloss);

const usable = (gloss: string): boolean =>
  gloss !== "" && !/^[`'"]/.test(gloss) && !isOffensive(gloss);

/** The first clean sense of at most 90 characters, else the first clean one; none when all are unfit. */
export function pickGloss(glosses: string[]): string | undefined {
  const clean = glosses.filter(usable);

  return clean.find((g) => shown(g).length <= SHORT) ?? clean[0];
}
