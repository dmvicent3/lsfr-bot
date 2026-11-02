import { MessageFlags } from "discord.js";
import { log } from "../../../core/log.ts";
import { PRACTICE } from "../components/guard.ts";
import { openPractice } from "../play/practice.ts";
import { boardView } from "../render/board-view.ts";
import { gridView } from "../render/view.ts";
import type { CommandCtx } from "./types.ts";
import { UNAVAILABLE } from "./unavailable.ts";

/** Private: the kept practice grid, or a new one. */
export async function practice(c: CommandCtx): Promise<void> {
  const { i, guildId, repo, random } = c;

  await i.deferReply({ flags: MessageFlags.Ephemeral });

  const snapshot = c.snapshotSource();

  if (!snapshot) {
    log.error("grid", "country data missing, country grid unavailable");
    await i.editReply(UNAVAILABLE);

    return;
  }

  const open = { guildId, userId: i.user.id, now: Date.now(), snapshot };
  const round = openPractice(repo, open, random);

  if (!round) {
    log.error("grid", `no practice grid generated for ${guildId}`);
    await i.editReply("Couldn't build a practice grid. Try again.");

    return;
  }

  const view = boardView({ scope: PRACTICE, number: null }, round.grid, round);

  await i.editReply(gridView(view, snapshot));
}
