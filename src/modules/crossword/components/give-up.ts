import type { ComponentHandler } from "../../../core/types.ts";
import { giveUp } from "../play/give-up.ts";
import { load } from "./guard.ts";
import { present, refresh } from "./show.ts";

/** `crossword:giveup:<date|practice>:<stamp>[:<menu>]`: ends the round unsolved, 0 points. */
export const giveUpHandler: ComponentHandler = {
  id: "crossword:giveup",
  async handle(i, args, ctx) {
    const r = load(i, ctx.db, args);

    if (!r || r.stale) return refresh(i, r);

    await present(i, r, giveUp(r.repo, r.rec, r.now));
  },
};
