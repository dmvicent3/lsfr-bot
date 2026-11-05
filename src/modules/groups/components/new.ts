import { tell } from "../../../core/replies.ts";
import type { ComponentHandler } from "../../../core/types.ts";
import { practiceMake } from "../play/make.ts";
import { newPractice } from "../play/practice.ts";
import { boardView } from "../render/board-view.ts";
import { groupsView } from "../render/view.ts";
import { GroupsRepo } from "../store/repo.ts";
import { PRACTICE } from "./guard.ts";

export const FAILED = "Couldn't build a practice puzzle. Try again.";

/** `groups:new`: a fresh practice puzzle replaces the kept one. */
export const newHandler = (random: () => number): ComponentHandler => ({
  id: "groups:new",
  async handle(i, _args, ctx) {
    if (!i.guildId) return tell(i, "Groups works in a server.");

    const open = { guildId: i.guildId, userId: i.user.id, now: Date.now() };
    const round = newPractice(new GroupsRepo(ctx.db), open, practiceMake(random));

    if (!round) return tell(i, FAILED);

    const where = { scope: PRACTICE, number: null, puzzle: round.puzzle };

    await i.update(groupsView(boardView(where, round)));
  },
});
