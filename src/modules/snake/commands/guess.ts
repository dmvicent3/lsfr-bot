import { MessageFlags } from "discord.js";
import { dayOf } from "../../../core/daily-guard.ts";
import { reply } from "../../../core/replies.ts";
import { dateIn } from "../../../core/zoned.ts";
import { acceptedWords } from "../../word/words/load.ts";
import { announce } from "../components/announce.ts";
import { PRACTICE } from "../components/guard.ts";
import { FIRST_PUZZLE } from "../periods.ts";
import { dailyMake } from "../play/make.ts";
import { openDaily } from "../play/open.ts";
import { guess as play } from "../play/turn.ts";
import { isGame, type Rec } from "../play/types.ts";
import { refusalText } from "../play/validate.ts";
import { boardView } from "../render/board-view.ts";
import type { Where } from "../render/types.ts";
import { snakeView } from "../render/view.ts";
import { snakeTimeZone } from "../settings.ts";
import type { CommandCtx } from "./types.ts";

export const NO_PRACTICE = "No practice round open. Start one with `/snake practice`.";
export const NO_DAILY = "No snake today — couldn't pick a word.";

/** Today's daily round (opened if new), or the player's kept practice round; null when none. */
function roundOf(c: CommandCtx, now: number): { rec: Rec; where: Where } | null {
  const { i, guildId, db, repo } = c;

  if (c.i.options.getBoolean("practice")) {
    const rec = repo.practice.get(guildId, i.user.id);

    return rec ? { rec, where: { scope: PRACTICE, number: null, answer: rec.answer } } : null;
  }

  const tz = snakeTimeZone(db, guildId);
  const date = dateIn(now, tz);
  const v = { guildId, userId: i.user.id, date, now };
  const opened = openDaily(repo, v, dailyMake(repo, v));

  if (!opened) return null;

  const where = { scope: date, answer: opened.answer, ...dayOf(date, FIRST_PUZZLE, now, tz) };

  return { rec: opened.game, where };
}

/**
 * `/snake guess word [practice]`: one guess on today's snake or the practice round, as
 * `/word guess` is for Word. A refusal is told privately; a solved daily is announced.
 */
export async function guess(c: CommandCtx): Promise<void> {
  const now = Date.now();
  const round = roundOf(c, now);

  if (!round) return reply(c.i, c.i.options.getBoolean("practice") ? NO_PRACTICE : NO_DAILY);

  const turn = { repo: c.repo, rec: round.rec, answer: round.where.answer, now };
  const played = play(turn, c.i.options.getString("word", true), acceptedWords);

  if (played.kind === "refused") return reply(c.i, refusalText(played.reason));

  const { landed } = played;
  const view = snakeView(boardView(round.where, landed.game, landed.award));

  await c.i.reply({ ...view, flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });

  if (landed.award && isGame(landed.game)) await announce(c.i, landed.game, round.where);
}
