import { MessageFlags } from "discord.js";
import { untilNext } from "../../../core/daily.ts";
import { reply } from "../../../core/replies.ts";
import { submitMultiGuess } from "../multi/guess.ts";
import { multiRefusal } from "../multi/refusal.ts";
import type { Mode } from "../multi/types.ts";
import { multiView } from "../multi/view.ts";
import { shareRound } from "../components/multi-share.ts";
import { wordLists } from "../words/load.ts";
import { modePuzzle, NO_WORDS } from "./multi-puzzle.ts";
import type { Handler } from "./types.ts";

/**
 * `/duo guess` and `/quad guess`: one word on every board, as `/word guess` is for classic. A
 * refusal is told privately; a finish is also posted publicly as squares.
 */
export const multiGuess =
  (mode: Mode): Handler =>
  async (c) => {
    const today = modePuzzle(c, mode);

    if (!today) return reply(c.i, NO_WORDS);

    const { puzzle, now, timeZone } = today;
    const accepted = wordLists(puzzle.length)?.accepted ?? new Set<string>();
    const text = c.i.options.getString("word", true);
    const guess = { puzzle, userId: c.i.user.id, text, accepted, now };
    const result = submitMultiGuess(c.db, c.repo, guess);

    if (result.kind === "refused") {
      return reply(c.i, multiRefusal(result.reason, puzzle, untilNext(now, timeZone)));
    }

    await c.i.reply({
      ...multiView({ ...today, game: result.game }),
      flags: MessageFlags.Ephemeral,
    });

    if (result.kind === "finished") await shareRound(c.i, puzzle, result.game);
  };
