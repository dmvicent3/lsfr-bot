import { tell } from "../../../core/replies.ts";
import type { ComponentHandler } from "../../../core/types.ts";
import { giveUpMulti } from "../multi/give-up.ts";
import { loadRound, showRound } from "./multi-round.ts";
import { shareRound } from "./multi-share.ts";

/** `word:giveup:<mode>:<date>`: ends the game as a loss, shows the words, posts the squares. */
export const multiGiveUpHandler: ComponentHandler = {
  id: "word:giveup",
  async handle(i, args, ctx) {
    const r = loadRound(i, ctx.db, args);

    if (typeof r === "string") return tell(i, r);

    const userId = i.user.id;
    const result = giveUpMulti(ctx.db, r.repo, { puzzle: r.puzzle, userId, now: r.now });

    if (result.kind !== "finished") {
      return showRound(i, r, r.repo.multiGames.get({ ...r.puzzle, userId }));
    }

    await showRound(i, r, result.game);
    await shareRound(i, r.puzzle, result.game);
  },
};
