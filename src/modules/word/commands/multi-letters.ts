import { reply } from "../../../core/replies.ts";
import { multiLettersText } from "../multi/letters-text.ts";
import type { Mode } from "../multi/types.ts";
import { modePuzzle, NO_WORDS } from "./multi-puzzle.ts";
import type { Handler } from "./types.ts";

/** `/duo letters`, `/quad letters`: each board's letter notes, privately. */
export const multiLetters =
  (mode: Mode): Handler =>
  async (c) => {
    const today = modePuzzle(c, mode);

    if (!today) return reply(c.i, NO_WORDS);

    const game = c.repo.multiGames.get({ ...today.puzzle, userId: c.i.user.id });

    await reply(c.i, multiLettersText({ puzzle: today.puzzle, guesses: game?.guesses ?? [] }));
  };
