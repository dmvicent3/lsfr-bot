import { MessageFlags } from "discord.js";
import { log } from "../../../core/log.ts";
import { PRACTICE } from "../components/guard.ts";
import { practiceMake } from "../play/make.ts";
import { openPractice } from "../play/practice.ts";
import { boardView } from "../render/board-view.ts";
import { sizeOf } from "../render/ids.ts";
import { crosswordView } from "../render/view.ts";
import type { CommandCtx } from "./types.ts";

/** The asked size; else the kept puzzle's, else 5. */
function wantedSize(c: CommandCtx): 5 | 7 {
  const given = c.i.options.getInteger("size");
  const kept = c.repo.practice.get(c.guildId, c.i.user.id);

  return sizeOf(String(given ?? kept?.puzzle.size)) ?? 5;
}

/** Private: the kept practice crossword, or a new one. */
export async function practice(c: CommandCtx): Promise<void> {
  const { i, guildId, repo, ask, random } = c;

  await i.deferReply({ flags: MessageFlags.Ephemeral });

  const now = Date.now();
  const size = wantedSize(c);
  const make = practiceMake(size, random, ask);
  const round = await openPractice(repo, { guildId, userId: i.user.id, now }, size, make);

  if (!round) {
    log.error("crossword", `no practice crossword generated for ${guildId}`);
    await i.editReply("Couldn't build a practice crossword. Try again.");

    return;
  }

  const where = { scope: PRACTICE, number: null, stored: round };

  await i.editReply(crosswordView(boardView(where, round, now)));
}
