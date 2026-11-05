import { puzzleNumber, untilNext } from "../../../core/daily.ts";
import { tell } from "../../../core/replies.ts";
import type { ModalHandler } from "../../../core/types.ts";
import { submitMultiGuess } from "../multi/guess.ts";
import { GUESS_FIELD } from "../multi/ids.ts";
import { MODES } from "../multi/modes.ts";
import type { MultiPuzzle } from "../multi/types.ts";
import { FIRST_MULTI_PUZZLE } from "../puzzle-date.ts";
import type { RefusedReason } from "../types.ts";
import { refusalText } from "../validate.ts";
import { wordLists } from "../words/load.ts";
import { loadRound, showRound } from "./multi-round.ts";
import { shareRound } from "./multi-share.ts";

const refusal = (reason: RefusedReason, p: MultiPuzzle, wait: string): string =>
  refusalText(reason, {
    name: MODES[p.mode].name,
    length: p.length,
    number: puzzleNumber(p.date, FIRST_MULTI_PUZZLE),
    wait,
  });

/**
 * `word:answer:<mode>:<date>`: the typed guess on every board; a refusal is told privately, a
 * finish is also posted publicly as squares.
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
      return tell(i, refusal(result.reason, puzzle, untilNext(now, r.timeZone)));
    }

    await showRound(i, r, result.game);

    if (result.kind === "finished") await shareRound(i, puzzle, result.game);
  },
};
