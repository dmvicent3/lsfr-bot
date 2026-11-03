import type { ComponentHandler } from "../../../core/types.ts";
import { revealLetter } from "../play/turn.ts";
import { load, turnOf } from "./guard.ts";
import { present, refresh } from "./show.ts";

/** `crossword:reveal:<date|practice>:<stamp>`: fills one empty cell for 10 points. */
export const revealHandler: ComponentHandler = {
  id: "crossword:reveal",
  async handle(i, args, ctx) {
    const r = load(i, ctx.db, args);

    if (!r || r.stale) return refresh(i, r);

    await present(i, r, revealLetter(turnOf(r)));
  },
};
