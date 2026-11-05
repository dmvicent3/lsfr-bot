import { spacedCaps } from "../../../core/spaced.ts";
import { feedback } from "../feedback.ts";
import type { Mark } from "../types.ts";

const SQUARE: Record<Mark, string> = { hit: "🟩", near: "🟨", miss: "⬛" };

export const squares = (marks: Mark[]): string => marks.map((m) => SQUARE[m]).join("");

/** Each guess as spaced capitals, then its squares. */
export function boardLines(guesses: string[], answer: string): string {
  return guesses.map((g) => `${spacedCaps(g)} ${squares(feedback(g, answer))}`).join("\n");
}
