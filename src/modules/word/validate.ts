import type { GuessCheck, RefusedReason } from "./types.ts";

const refuse = (reason: RefusedReason): GuessCheck => ({ ok: false, reason });

/** Checked in order: game over, letters only, length, in the list, not tried yet. */
export function checkGuess(c: {
  text: string;
  length: number;
  accepted: ReadonlySet<string>;
  guesses: readonly string[];
  finished: boolean;
}): GuessCheck {
  const word = c.text.trim().toLowerCase();

  if (c.finished) return refuse("finished");

  if (!/^[a-z]+$/.test(word)) return refuse("letters");

  if (word.length !== c.length) return refuse("length");

  if (!c.accepted.has(word)) return refuse("unknown");

  return c.guesses.includes(word) ? refuse("repeat") : { ok: true, word };
}

const TEXTS: Record<
  RefusedReason,
  (c: { length: number; number: number; wait: string }) => string
> = {
  finished: (c) => `You've finished Word #${c.number}, next puzzle in ${c.wait}.`,
  letters: () => "Letters only.",
  length: (c) => `Guesses are ${c.length} letters.`,
  unknown: () => "That's not in the word list. No attempt used.",
  repeat: () => "You already tried that.",
};

export function refusalText(
  reason: RefusedReason,
  c: { length: number; number: number; wait: string },
): string {
  return TEXTS[reason](c);
}
