import { JevError } from "../../core/jev/http.ts";
import type { Jev } from "../../core/jev/types.ts";
import { turnOf } from "./board.ts";
import { candidates } from "./candidates.ts";
import { jevosMove } from "./game.ts";
import { guess, pick } from "./pick.ts";
import { evidence, questions } from "./prompt.ts";
import type { Game, JevosPick, JevosTurn } from "./types.ts";

/** The facts for an empty board run ~2.7k characters; jev's default cut is 1,500. */
const MAX_STATE = 4_000;

/**
 * jevos's move (its turn): a forced one or a lone candidate without asking, else jev's pick among
 * the candidates for the game's difficulty; a random candidate when jev cannot answer.
 */
export async function askJevos(
  jev: Jev,
  game: Pick<Game, "board" | "difficulty">,
  random: () => number,
): Promise<JevosPick> {
  const me = turnOf(game.board);
  const { squares, forced } = candidates(game.board, me, game.difficulty);

  if (forced || squares.length === 1) return { square: guess(squares, random).square, share: 1 };

  try {
    const answers = await jev.yesNo(evidence(game.board, me, squares), questions(squares, me), {
      maxState: MAX_STATE,
    });

    return pick(answers, random);
  } catch (err) {
    if (err instanceof JevError) return guess(squares, random);

    throw err;
  }
}

/** jevos's turn: it picks, then plays that square. */
export async function jevosTurn(
  jev: Jev,
  game: Game,
  random: () => number,
  now: number,
): Promise<JevosTurn> {
  const last = await askJevos(jev, game, random);

  return { moved: jevosMove(game, last.square, now), last };
}
