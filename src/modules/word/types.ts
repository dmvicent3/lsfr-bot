/** One length's words: answers to pick from, and every word a guess may be. */
export interface WordLists {
  answers: readonly string[];
  accepted: ReadonlySet<string>;
}

/** One letter's feedback: right place, elsewhere in the word, or not in it. */
export type Mark = "hit" | "near" | "miss";
