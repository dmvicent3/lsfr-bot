import type { GuessCheck, Refusal } from "../types.ts";

export const MIN_GUESS = 2;
export const MAX_GUESS = 10;

const refuse = (reason: Refusal): GuessCheck => ({ ok: false, reason });

/** What a guess is checked against: the accepted words of a length, the round so far. */
export interface CheckCtx {
  accepted: (length: number) => ReadonlySet<string> | null;
  guesses: readonly string[];
  finished: boolean;
}

/** Checked in order: round over, letters only, 2–10 letters, a known word, not tried yet. */
export function checkGuess(text: string, c: CheckCtx): GuessCheck {
  const word = text.trim().toLowerCase();

  if (c.finished) return refuse("finished");

  if (!/^[a-z]+$/.test(word)) return refuse("letters");

  if (word.length < MIN_GUESS || word.length > MAX_GUESS) return refuse("length");

  if (!c.accepted(word.length)?.has(word)) return refuse("unknown");

  return c.guesses.includes(word) ? refuse("repeat") : { ok: true, word };
}

const TEXTS: Record<Refusal, string> = {
  finished: "This round is over.",
  letters: "Letters only, A–Z.",
  length: `Guesses are ${MIN_GUESS} to ${MAX_GUESS} letters.`,
  unknown: "That's not in the word list. Not counted.",
  repeat: "You already tried that. Not counted.",
};

export const refusalText = (reason: Refusal): string => TEXTS[reason];
