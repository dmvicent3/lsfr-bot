/** One length's words: answers to pick from, and every word a guess may be. */
export interface WordLists {
  answers: readonly string[];
  accepted: ReadonlySet<string>;
}

/** One letter's feedback: right place, elsewhere in the word, or not in it. */
export type Mark = "hit" | "near" | "miss";

export type Period = "today" | "week" | "month" | "all";

/** Puzzle dates from `from` to `to`, both YYYY-MM-DD and inclusive. */
export interface DateRange {
  from: string;
  to: string;
  label: string;
}

export type RefusedReason = "finished" | "length" | "letters" | "unknown" | "repeat";

/** A guess that counts, or why it doesn't (it then costs no attempt). */
export type GuessCheck = { ok: true; word: string } | { ok: false; reason: RefusedReason };
