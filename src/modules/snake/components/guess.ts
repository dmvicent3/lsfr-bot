import type { ComponentHandler } from "../../../core/types.ts";
import { roundName } from "../render/board.ts";
import { guessModal } from "../render/modal.ts";
import { load } from "./guard.ts";
import { refresh } from "./show.ts";

/** `snake:guess:<date|practice>:<stamp>`: the guess modal; a finished or earlier round is redrawn instead. */
export const guessHandler: ComponentHandler = {
  id: "snake:guess",
  async handle(i, args, ctx) {
    const r = load(i, ctx.db, args);

    if (!r || r.stale || r.rec.finishedAt !== null) return refresh(i, r);

    const title = roundName(r.where.number);

    await i.showModal(guessModal({ scope: r.where.scope, stamp: args[1] ?? "", title }));
  },
};
