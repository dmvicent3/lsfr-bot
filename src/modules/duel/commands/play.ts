import { MessageFlags } from "discord.js";
import { puzzleNumber, untilNext } from "../../../core/daily.ts";
import { log } from "../../../core/log.ts";
import { dateIn } from "../../../core/zoned.ts";
import { announce } from "../components/announce.ts";
import { FIRST_PUZZLE } from "../periods.ts";
import { healed } from "../play/heal.ts";
import { QUESTIONS } from "../questions/bands.ts";
import { openDay } from "../play/open.ts";
import { view } from "../render/view.ts";
import { duelTimeZone } from "../settings.ts";
import type { CommandCtx } from "./types.ts";

/** Private: today's question, or the result once finished. */
export async function play({ i, guildId, db, repo, snapshotSource }: CommandCtx): Promise<void> {
  /** The first open of a day generates the puzzle, so answer first. */
  await i.deferReply({ flags: MessageFlags.Ephemeral });

  const snapshot = snapshotSource();

  if (!snapshot) {
    log.error("duel", "country data missing, stat duel unavailable");
    await i.editReply("Stat duel is unavailable — country data is missing.");

    return;
  }

  const now = Date.now();
  const tz = duelTimeZone(db, guildId);
  const date = dateIn(now, tz);
  const opened = openDay(repo, { guildId, userId: i.user.id, date, now, snapshot });

  if (!opened) {
    log.error("duel", `no questions generated for ${guildId} ${date}`);
    await i.editReply("No questions today — the country data looks broken.");

    return;
  }

  const { puzzle } = opened;

  if (puzzle.questions.length < QUESTIONS) {
    log.error("duel", `only ${puzzle.questions.length} questions for ${guildId} ${date}`);
  }

  const { game, award } = healed(repo, puzzle, opened.game, now);
  const number = puzzleNumber(date, FIRST_PUZZLE);

  await i.editReply(view(puzzle, game, { number, untilNext: untilNext(now, tz), award }));

  if (award) await announce(i, puzzle, game);
}
