import { MessageFlags } from "discord.js";
import { puzzleNumber, untilNext } from "../../../core/daily.ts";
import { log } from "../../../core/log.ts";
import { dateIn } from "../../../core/zoned.ts";
import { announce } from "../components/announce.ts";
import { FIRST_PUZZLE } from "../periods.ts";
import { healed } from "../play/heal.ts";
import { openDay } from "../play/open.ts";
import { isGame } from "../play/round.ts";
import { boardView } from "../render/board-view.ts";
import { gridView } from "../render/view.ts";
import { gridTimeZone } from "../settings.ts";
import { snapshotOrReply } from "./unavailable.ts";
import type { CommandCtx } from "./types.ts";

/** Private: today's grid, or the result once finished. */
export async function play(c: CommandCtx): Promise<void> {
  const { i, guildId, db, repo } = c;

  /** The first open of a day generates the puzzle, so answer first. */
  await i.deferReply({ flags: MessageFlags.Ephemeral });

  const snapshot = await snapshotOrReply(c);

  if (!snapshot) return;

  const now = Date.now();
  const tz = gridTimeZone(db, guildId);
  const date = dateIn(now, tz);
  const opened = openDay(repo, { guildId, userId: i.user.id, date, now, snapshot });

  if (!opened) {
    log.error("grid", `no grid generated for ${guildId} ${date}`);
    await i.editReply("No grid today — the country data looks broken.");

    return;
  }

  const { game, award } = healed(repo, opened.game, now);
  const number = puzzleNumber(date, FIRST_PUZZLE);
  const where = { scope: date, number, untilNext: untilNext(now, tz) };

  await i.editReply(gridView(boardView(where, opened.puzzle.grid, game, award), snapshot));

  if (award && isGame(game)) await announce(i, game, number);
}
