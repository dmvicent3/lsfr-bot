import { MessageFlags } from "discord.js";
import { log } from "../../../core/log.ts";
import { reply } from "../../../core/replies.ts";
import { FAILED } from "../components/new.ts";
import { PRACTICE } from "../components/guard.ts";
import { practiceMake } from "../play/make.ts";
import { openPractice } from "../play/practice.ts";
import { boardView } from "../render/board-view.ts";
import { groupsView } from "../render/view.ts";
import type { CommandCtx } from "./types.ts";

/** Private: the kept practice puzzle, or a new one. */
export async function practice({ i, guildId, repo, random }: CommandCtx): Promise<void> {
  const open = { guildId, userId: i.user.id, now: Date.now() };
  const round = openPractice(repo, open, practiceMake(random));

  if (!round) {
    log.error("groups", `no practice puzzle generated for ${guildId}`);

    return reply(i, FAILED);
  }

  const view = groupsView(
    boardView({ scope: PRACTICE, number: null, puzzle: round.puzzle }, round),
  );

  await i.reply({ ...view, flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
}
