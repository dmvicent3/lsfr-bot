import { tell } from "../../../core/replies.ts";
import type { ComponentHandler } from "../../../core/types.ts";
import { practiceMake } from "../play/make.ts";
import { newPractice } from "../play/practice.ts";
import { boardView } from "../render/board-view.ts";
import { snakeView } from "../render/view.ts";
import { SnakeRepo } from "../store/repo.ts";
import { PRACTICE } from "./guard.ts";

export const FAILED = "Couldn't pick a practice word. Try again.";

/** `snake:new`: a fresh practice round replaces the kept one. */
export const newHandler = (random: () => number): ComponentHandler => ({
  id: "snake:new",
  async handle(i, _args, ctx) {
    if (!i.guildId) return tell(i, "Snake works in a server.");

    const open = { guildId: i.guildId, userId: i.user.id, now: Date.now() };
    const round = newPractice(new SnakeRepo(ctx.db), open, practiceMake(random));

    if (!round) return tell(i, FAILED);

    const where = { scope: PRACTICE, number: null, answer: round.answer };

    await i.update(snakeView(boardView(where, round)));
  },
});
