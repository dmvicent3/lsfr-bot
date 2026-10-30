import { JevError } from "../../core/jev/http.ts";
import type { Jev } from "../../core/jev/types.ts";
import { candidates } from "./candidates.ts";
import { JEVOS, jevosDrop } from "./game.ts";
import { guess, pick } from "./pick.ts";
import { evidence, questions } from "./prompt.ts";
import type { Game, JevosPick, Moved } from "./types.ts";

/** The facts for all 7 columns run ~2.8k characters; jev's default cut is 1,500. */
export const MAX_STATE = 4_000;

/**
 * jevos's column (its turn): a forced one or a lone candidate without asking, else jev's pick
 * among the candidates for the game's difficulty; a random candidate when jev cannot answer.
 */
export async function askJevos(jev: Jev, game: Game, random: () => number): Promise<JevosPick> {
  const { cols, forced } = candidates(game.board, JEVOS, game.difficulty);

  if (forced || cols.length === 1) return { col: guess(cols, random).col, share: 1 };

  try {
    const answers = await jev.yesNo(evidence(game.board, JEVOS, cols), questions(cols, JEVOS), {
      maxState: MAX_STATE,
    });

    return pick(answers, random);
  } catch (err) {
    if (err instanceof JevError) return guess(cols, random);

    throw err;
  }
}

/** jevos's turn: it picks, then drops there. */
export async function jevosTurn(
  jev: Jev,
  game: Game,
  random: () => number,
  now: number,
): Promise<{ moved: Moved; last: JevosPick }> {
  const last = await askJevos(jev, game, random);

  return { moved: jevosDrop(game, last.col, now), last };
}
