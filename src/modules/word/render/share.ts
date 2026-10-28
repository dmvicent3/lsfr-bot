import { feedback } from "../feedback.ts";
import { MAX_ATTEMPTS } from "../scoring.ts";
import { squares } from "./board.ts";

/** The public post for a finished game: squares only, never letters. */
export function shareText(p: {
  userId: string;
  number: number;
  guesses: string[];
  answer: string;
  won: boolean;
}): string {
  const heading = p.won
    ? `<@${p.userId}> solved Word #${p.number} in ${p.guesses.length}/${MAX_ATTEMPTS}`
    : `<@${p.userId}> missed Word #${p.number} — X/${MAX_ATTEMPTS}`;
  const grid = p.guesses.map((g) => squares(feedback(g, p.answer)));

  return [heading, ...grid].join("\n");
}
