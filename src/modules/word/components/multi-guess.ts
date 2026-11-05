import { tell } from "../../../core/replies.ts";
import type { ComponentHandler } from "../../../core/types.ts";
import { guessModal } from "../multi/modal.ts";
import { loadRound, showRound } from "./multi-round.ts";

/** `word:guess:<mode>:<date>`: the guess modal; a finished board is redrawn instead. */
export const multiGuessHandler: ComponentHandler = {
  id: "word:guess",
  async handle(i, args, ctx) {
    const r = loadRound(i, ctx.db, args);

    if (typeof r === "string") return tell(i, r);

    if (r.game?.finishedAt) return showRound(i, r, r.game);

    await i.showModal(guessModal(r.puzzle));
  },
};
