/** One length's words: answers to pick from, and every word a guess may be. */
export interface WordLists {
  answers: readonly string[];
  accepted: ReadonlySet<string>;
}
