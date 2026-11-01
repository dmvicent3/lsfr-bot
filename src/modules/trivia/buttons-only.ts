import type { Bank } from "./types.ts";

/** What a buttons-only session asks from: questions with options, no KAOS lists (they are typed); pictures stay, asked with buttons. */
export const buttonsOnlyBank = (b: Bank): Bank => ({
  questions: b.questions.filter((q) => q.kind === "choice"),
  lists: [],
  pictures: b.pictures,
});
