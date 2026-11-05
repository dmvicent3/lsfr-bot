import type { ComponentHandler } from "../../../core/types.ts";
import { giveUp } from "../play/turn.ts";
import { load, turnOf } from "./guard.ts";
import { present, refresh } from "./show.ts";

/** `snake:giveup:<date|practice>:<stamp>`: ends the round and shows the word. */
export const giveUpHandler: ComponentHandler = {
  id: "snake:giveup",
  async handle(i, args, ctx) {
    const r = load(i, ctx.db, args);

    if (!r || r.stale) return refresh(i, r);

    await present(i, r, giveUp(turnOf(r)));
  },
};
