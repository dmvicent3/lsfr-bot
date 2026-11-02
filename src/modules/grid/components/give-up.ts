import { tell } from "../../../core/replies.ts";
import type { ComponentHandler } from "../../../core/types.ts";
import { gridView } from "../render/view.ts";
import { announce } from "./announce.ts";
import { OUT_OF_DATE, type Source, load } from "./guard.ts";
import { boardView, end, isGame } from "./land.ts";

/** `grid:giveup:<date|practice>`: finishes the round with what is filled. */
export const giveUpHandler = (source: Source): ComponentHandler => ({
  id: "grid:giveup",
  async handle(i, args, ctx) {
    const r = load(i, ctx.db, args[0], source);

    if (!r) return tell(i, OUT_OF_DATE);

    const { game, award } =
      r.rec.finishedAt === null ? end(r.repo, r.rec, r.now) : { game: r.rec, award: r.award };

    await i.update(gridView(boardView(r, r.grid, game, award), r.snap));

    if (award && isGame(game)) await announce(i, game, r.number ?? 0);
  },
});
