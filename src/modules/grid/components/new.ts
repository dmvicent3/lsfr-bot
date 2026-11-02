import { tell } from "../../../core/replies.ts";
import type { ComponentHandler } from "../../../core/types.ts";
import { newPractice } from "../play/practice.ts";
import { gridView } from "../render/view.ts";
import { GridRepo } from "../store/repo.ts";
import { PRACTICE, type Source } from "./guard.ts";
import { boardView } from "./land.ts";

/** `grid:new`: a fresh practice grid replaces the kept one. */
export const newHandler = (source: Source): ComponentHandler => ({
  id: "grid:new",
  async handle(i, _args, ctx) {
    const snapshot = source();

    if (!i.guildId || !snapshot) return tell(i, "Country grid is unavailable right now.");

    const open = { guildId: i.guildId, userId: i.user.id, now: Date.now(), snapshot };
    const round = newPractice(new GridRepo(ctx.db), open, Math.random);

    if (!round) return tell(i, "Couldn't build a practice grid. Try again.");

    const view = boardView({ scope: PRACTICE, number: null }, round.grid, round);
    await i.update(gridView(view, snapshot));
  },
});
