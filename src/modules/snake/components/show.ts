import {
  type MessageComponentInteraction,
  MessageFlags,
  type ModalMessageModalSubmitInteraction,
  type ModalSubmitInteraction,
} from "discord.js";
import { log } from "../../../core/log.ts";
import { tell } from "../../../core/replies.ts";
import { type Landed, isGame } from "../play/types.ts";
import { boardView } from "../render/board-view.ts";
import { snakeView } from "../render/view.ts";
import { announce } from "./announce.ts";
import { type Round, STALE } from "./guard.ts";

export type Click = MessageComponentInteraction | ModalSubmitInteraction;
type Editable = MessageComponentInteraction | ModalMessageModalSubmitInteraction;

/** A click, or a submit from the board's own message, can edit that message. */
const canUpdate = (i: Click): i is Editable => !("fields" in i) || i.isFromMessage();

/**
 * Shows a round after a move: edits the board in place (a modal opened elsewhere gets it as an
 * ephemeral reply), then announces a finished daily if this move produced the award. A failed
 * edit is logged and the announce still happens, since the award is already spent.
 */
export async function present(i: Click, r: Round, landed: Landed): Promise<void> {
  const view = snakeView(boardView(r.where, landed.game, landed.award));

  try {
    if (canUpdate(i)) await i.update(view);
    else await i.reply({ ...view, flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
  } catch (err) {
    log.error("snake", "could not show the board", err);
  }

  if (landed.award && isGame(landed.game)) await announce(i, landed.game, r.where);
}

/** The answer for a round that is missing or belongs to an earlier one: the current board, if any. */
export async function refresh(i: Click, r: Round | null): Promise<void> {
  if (!r || !canUpdate(i)) return tell(i, STALE);

  await present(i, r, { game: r.rec, award: null });
}
