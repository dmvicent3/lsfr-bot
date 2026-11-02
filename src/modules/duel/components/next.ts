import type { ComponentHandler } from "../../../core/types.ts";
import { view } from "../render/view.ts";
import { announce } from "./announce.ts";
import { OUT_OF_DATE, load, tell } from "./guard.ts";

/** `duel:next:<date>`: the next question, or the result once there are none. */
export const nextHandler: ComponentHandler = {
  id: "duel:next",
  async handle(i, args, ctx) {
    const s = load(i, ctx.db, args[0]);

    if (!s) return tell(i, OUT_OF_DATE);

    await i.update(view(s.puzzle, s.game, { ...s.view, award: s.award }));

    if (s.award) await announce(i, s.puzzle, s.game);
  },
};
