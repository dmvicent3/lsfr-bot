import { MessageFlags } from "discord.js";
import { tell } from "../../../core/replies.ts";
import type { ComponentHandler } from "../../../core/types.ts";
import { type Ask, practiceMake } from "../play/make.ts";
import { newPractice } from "../play/practice.ts";
import { boardView } from "../render/board-view.ts";
import { sizeOf } from "../render/ids.ts";
import { crosswordView } from "../render/view.ts";
import { CrosswordRepo } from "../store/repo.ts";
import { PRACTICE, STALE } from "./guard.ts";

const FAILED = "Couldn't build a practice crossword. Try again.";

/** `crossword:new:<size>`: a fresh practice puzzle replaces the kept one. */
export const newHandler = (ask: Ask | null, random: () => number): ComponentHandler => ({
  id: "crossword:new",
  async handle(i, args, ctx) {
    if (!i.guildId) return tell(i, "Crossword works in a server.");

    const size = sizeOf(args[0]);

    if (!size) return tell(i, STALE);

    // Writing clues can outlast Discord's 3 s for a first answer, so acknowledge the click first.
    await i.deferUpdate();
    const now = Date.now();
    const open = { guildId: i.guildId, userId: i.user.id, now };
    const make = practiceMake(size, random, ask);
    const round = await newPractice(new CrosswordRepo(ctx.db), open, make);

    if (!round) {
      const none = {
        content: FAILED,
        flags: MessageFlags.Ephemeral as const,
        allowedMentions: { parse: [] as [] },
      };
      await i.followUp(none);

      return;
    }

    const where = { scope: PRACTICE, number: null, stored: round };
    await i.editReply(crosswordView(boardView(where, round, now)));
  },
});
