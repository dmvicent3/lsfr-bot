import { end, keep } from "./round.ts";
import type { Landed, Played, Turn } from "./types.ts";
import { type CheckCtx, checkGuess } from "./validate.ts";

const open = (t: Turn): boolean => t.rec.finishedAt === null;

/**
 * Plays a typed guess: a refused one changes nothing; the answer solves the round; any other
 * word is added to the guesses.
 */
export function guess(t: Turn, text: string, accepted: CheckCtx["accepted"]): Played {
  const check = checkGuess(text, { accepted, guesses: t.rec.guesses, finished: !open(t) });

  if (!check.ok) return { kind: "refused", reason: check.reason };

  const rec = { ...t.rec, guesses: [...t.rec.guesses, check.word] };
  const landed = check.word === t.answer ? end(t.repo, rec, true, t.now) : keep(t.repo, rec);

  return { kind: "played", landed };
}

/** Ends the round as a give-up (0 points, the streak resets); a finished one stays as it is. */
export const giveUp = (t: Turn): Landed =>
  open(t) ? end(t.repo, t.rec, false, t.now) : { game: t.rec, award: null };
