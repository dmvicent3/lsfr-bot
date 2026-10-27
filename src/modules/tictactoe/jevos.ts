import { JevError } from "../../core/jev/http.ts";
import type { Jev } from "../../core/jev/types.ts";
import { turnOf } from "./board.ts";
import { guess, pick } from "./pick.ts";
import { evidence, questions } from "./prompt.ts";
import type { Board, JevosPick } from "./types.ts";

/** The facts for an empty board run ~2.7k characters; jev's default cut is 1,500. */
const MAX_STATE = 4_000;

/** jevos's move on `board` (its turn); a random empty square when jev cannot answer. */
export async function askJevos(jev: Jev, board: Board, random: () => number): Promise<JevosPick> {
  const me = turnOf(board);

  try {
    const answers = await jev.yesNo(evidence(board, me), questions(board, me), {
      maxState: MAX_STATE,
    });

    return pick(answers, random);
  } catch (err) {
    if (err instanceof JevError) return guess(board, random);

    throw err;
  }
}
