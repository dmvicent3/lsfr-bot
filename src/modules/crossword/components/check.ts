import type { ComponentHandler } from "../../../core/types.ts";
import { checkGrid } from "../play/turn.ts";
import { load, turnOf } from "./guard.ts";
import { present, refresh } from "./show.ts";

/** `crossword:check:<date|practice>:<stamp>[:<menu>]`: judges a full grid; right finishes, wrong costs 10. */
export const checkHandler: ComponentHandler = {
  id: "crossword:check",
  async handle(i, args, ctx) {
    const r = load(i, ctx.db, args);

    if (!r || r.stale) return refresh(i, r);

    await present(i, r, checkGrid(turnOf(r)));
  },
};
