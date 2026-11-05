/** 0 easiest (🟨) to 3 hardest (🟪). */
export type Level = 0 | 1 | 2 | 3;

/** One bank category: `words` can go on a board, `also` are members only checked for clashes. */
export interface Category {
  name: string;
  level: Level;
  words: string[];
  also: string[];
}

/** A group on a board: four lowercase words. */
export interface Group {
  name: string;
  level: Level;
  words: string[];
}

/**
 * Four groups, one per level, sorted by level. Word `4g + k` is `groups[g].words[k]`; `order`
 * is the starting button order, a permutation of 0–15 as hex digits.
 */
export interface Puzzle {
  groups: Group[];
  order: string;
}

/**
 * A round's progress, word indices as hex digits: `order` the button order, `picked` the
 * selected words, `found` the solved group indices in solve order, `guesses` the wrong guesses
 * (4 sorted digits each, comma-separated).
 */
export interface Progress {
  order: string;
  picked: string;
  found: string;
  guesses: string;
  mistakes: number;
  lastLine: string | null;
}

/** One player's daily game. */
export interface Game extends Progress {
  guildId: string;
  date: string;
  userId: string;
  solved: boolean | null;
  points: number | null;
  streak: number | null;
  startedAt: number;
  finishedAt: number | null;
}

/** A player's practice round: its own puzzle, no scoring. */
export interface Practice extends Progress {
  guildId: string;
  userId: string;
  puzzle: Puzzle;
  startedAt: number;
  finishedAt: number | null;
}

export interface Award {
  points: number;
  parts: string[];
}
