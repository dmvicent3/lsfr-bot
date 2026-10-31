import { JevError } from "../../core/jev/http.ts";
import type { Jev } from "../../core/jev/types.ts";
import { candidates } from "./aim.ts";
import { jevosFire } from "./game.ts";
import { guess, pick } from "./pick.ts";
import { evidence, questions } from "./prompt.ts";
import { sightOf } from "./sight.ts";
import type { Game, Moved } from "./types.ts";

/**
 * jevos's cell (its turn): a lone candidate without asking, else jev's pick among the candidates
 * for the game's difficulty; a random candidate when jev cannot answer.
 */
export async function askJevos(jev: Jev, g: Game, random: () => number): Promise<number> {
  const s = sightOf(g);
  const cells = candidates(s, g.difficulty, random);

  if (cells.length <= 1) return guess(cells, random);

  try {
    const answers = await jev.yesNo(evidence(s, cells), questions(cells));

    return pick(answers, cells, random) ?? guess(cells, random);
  } catch (err) {
    if (err instanceof JevError) return guess(cells, random);

    throw err;
  }
}

/** jevos's turn: it picks, then fires there. */
export async function jevosTurn(
  jev: Jev,
  g: Game,
  random: () => number,
  now: number,
): Promise<Moved> {
  return jevosFire(g, await askJevos(jev, g, random), now);
}
