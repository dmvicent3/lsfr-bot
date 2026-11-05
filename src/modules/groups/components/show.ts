import type { MessageComponentInteraction } from "discord.js";
import { log } from "../../../core/log.ts";
import { tell } from "../../../core/replies.ts";
import { type Landed, isGame } from "../play/types.ts";
import { boardView } from "../render/board-view.ts";
import { groupsView } from "../render/view.ts";
import { announce } from "./announce.ts";
import { type Round, STALE } from "./guard.ts";

/**
 * Shows a round after a move by editing the board in place, then announces a finished daily if
 * this move produced the award. A failed edit is logged and the announce still happens, since
 * the award is already spent.
 */
export async function present(
  i: MessageComponentInteraction,
  r: Round,
  landed: Landed,
): Promise<void> {
  try {
    await i.update(groupsView(boardView(r.where, landed.game, landed.award)));
  } catch (err) {
    log.error("groups", "could not show the board", err);
  }

  if (landed.award && isGame(landed.game)) {
    await announce(i, landed.game, { number: r.where.number ?? 0, puzzle: r.where.puzzle });
  }
}

/** The answer for a round that is missing or belongs to an earlier puzzle: the current board, if any. */
export async function refresh(i: MessageComponentInteraction, r: Round | null): Promise<void> {
  if (!r) return tell(i, STALE);

  await present(i, r, { game: r.rec, award: null });
}
