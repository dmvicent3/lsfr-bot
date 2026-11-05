import { untilNext } from "../../../core/daily.ts";
import { tell } from "../../../core/replies.ts";
import type { ModalHandler } from "../../../core/types.ts";
import { submitMultiGuess } from "../multi/guess.ts";
import { GUESS_FIELD } from "../multi/ids.ts";
import { multiRefusal } from "../multi/refusal.ts";
import { wordLists } from "../words/load.ts";
import { loadRound, showRound } from "./multi-round.ts";
import { shareRound } from "./multi-share.ts";

/**
 * `word:answer:<mode>:<date>`: a guess modal opened before guessing moved to `/duo guess` and
 * `/quad guess`, still taken so it isn't lost. The typed guess goes on every board; a refusal is
 * told privately, a finish is also posted publicly as squares.
 */
export const multiAnswerHandler: ModalHandler = {
  id: "word:answer",
  async handle(i, args, ctx) {
    const r = loadRound(i, ctx.db, args);

    if (typeof r === "string") return tell(i, r);

    const { puzzle, now } = r;
    const accepted = wordLists(puzzle.length)?.accepted ?? new Set<string>();
    const text = i.fields.getTextInputValue(GUESS_FIELD);
    const guess = { puzzle, userId: i.user.id, text, accepted, now };
    const result = submitMultiGuess(ctx.db, r.repo, guess);

    if (result.kind === "refused") {
      return tell(i, multiRefusal(result.reason, puzzle, untilNext(now, r.timeZone)));
    }

    await showRound(i, r, result.game);

    if (result.kind === "finished") await shareRound(i, puzzle, result.game);
  },
};
