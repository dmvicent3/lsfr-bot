import { guess } from "./guess.ts";
import { end, keep } from "./round.ts";
import { clear, toggle } from "./select.ts";
import { reshuffle } from "./shuffle.ts";
import { type Landed, type Rec, type Turn, isGame } from "./types.ts";

const unchanged = (t: Turn): Landed => ({ game: t.rec, award: null });

const open = (t: Turn): boolean => t.rec.finishedAt === null;

/** Stores the moved round, or leaves it when the move changed nothing. */
const store = (t: Turn, moved: Rec | null): Landed =>
  open(t) && moved ? keep(t.repo, moved) : unchanged(t);

/** Selects or unselects one word. */
export const pickWord = (t: Turn, word: number): Landed => store(t, toggle(t.rec, word));

/** Unselects every word. */
export const clearPicks = (t: Turn): Landed => store(t, clear(t.rec));

/** Puts the buttons in a new random order. */
export const shuffleWords = (t: Turn, random: () => number): Landed =>
  store(t, reshuffle(t.rec, random));

/** Judges the four picked words: the last group solves, the fourth mistake loses. */
export function submit(t: Turn): Landed {
  const g = open(t) ? guess(t.rec, isGame(t.rec)) : null;

  if (!g) return unchanged(t);

  if (g.end) return end(t.repo, g.progress, g.end === "solved", t.now);

  return keep(t.repo, g.progress);
}

/** Ends the round as a loss (0 points); a finished one stays as it is. */
export const giveUp = (t: Turn): Landed =>
  open(t) ? end(t.repo, t.rec, false, t.now) : unchanged(t);
