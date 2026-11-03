import { MessageFlags } from "discord.js";
import { puzzleNumber, untilNext } from "../../../core/daily.ts";
import { log } from "../../../core/log.ts";
import { dateIn } from "../../../core/zoned.ts";
import { FIRST_PUZZLE } from "../periods.ts";
import { dailyMake } from "../play/make.ts";
import { openDaily } from "../play/open.ts";
import { boardView } from "../render/board-view.ts";
import { crosswordView } from "../render/view.ts";
import { crosswordTimeZone } from "../settings.ts";
import type { CommandCtx } from "./types.ts";

/** Private: today's crossword, or the result once finished. */
export async function play(c: CommandCtx): Promise<void> {
  const { i, guildId, db, repo, ask } = c;

  /** The first open of a day builds the puzzle and writes its clues, so answer first. */
  await i.deferReply({ flags: MessageFlags.Ephemeral });

  const now = Date.now();
  const tz = crosswordTimeZone(db, guildId);
  const date = dateIn(now, tz);
  const make = dailyMake(repo, { guildId, date }, ask);
  const opened = await openDaily(repo, { guildId, userId: i.user.id, date, now }, make);

  if (!opened) {
    log.error("crossword", `no crossword generated for ${guildId} ${date}`);
    await i.editReply("No crossword today — couldn't build one.");

    return;
  }

  const number = puzzleNumber(date, FIRST_PUZZLE);
  const where = { scope: date, number, stored: opened.puzzle, untilNext: untilNext(now, tz) };

  await i.editReply(crosswordView(boardView(where, opened.game, now)));
}
