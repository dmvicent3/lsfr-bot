import { tell } from "../../../core/replies.ts";
import type { ComponentHandler } from "../../../core/types.ts";
import { giveUp } from "../play/give-up.ts";
import { isGame } from "../play/round.ts";
import { boardView } from "../render/board-view.ts";
import { gridView } from "../render/view.ts";
import { announce } from "./announce.ts";
import { OUT_OF_DATE, type Source, load } from "./guard.ts";

/** `grid:giveup:<date|practice>`: finishes the round with what is filled. */
export const giveUpHandler = (source: Source): ComponentHandler => ({
  id: "grid:giveup",
  async handle(i, args, ctx) {
    const r = load(i, ctx.db, args[0], source);

    if (!r) return tell(i, OUT_OF_DATE);

    const done = giveUp(r.repo, r.rec, r.now);
    // load may have just finished an over round; that award is this click's to show and announce.
    const { game } = done;
    const award = done.award ?? r.award;

    await i.update(gridView(boardView(r, r.grid, game, award), r.snap));

    if (award && isGame(game)) await announce(i, game, r.number ?? 0);
  },
});
