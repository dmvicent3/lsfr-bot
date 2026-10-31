import type { MessageComponentInteraction, TextBasedChannel } from "discord.js";
import { log } from "../../../core/log.ts";
import { renderFleet } from "../render/fleet.ts";
import type { GameView } from "../render/types.ts";
import type { Game } from "../types.ts";

/**
 * Posts the "Your fleet" message under the board (Discord stops drawing emoji past ~200 per
 * message, so the two grids can't share one). On failure the game goes on without it.
 */
export async function postFleet(i: MessageComponentInteraction, game: Game): Promise<Game> {
  try {
    if (!i.channel?.isSendable()) return game;

    const view = { game, outcome: { kind: "playing" }, aiming: false } as const;
    const message = await i.channel.send({ ...renderFleet(view), allowedMentions: { parse: [] } });

    return { ...game, fleetMessageId: message.id };
  } catch (err) {
    log.error("fleet", "could not post the player's fleet", err);

    return game;
  }
}

/** Brings the "Your fleet" message up to date (best effort; edits need no interaction token). */
export async function syncFleet(channel: TextBasedChannel | null, v: GameView): Promise<void> {
  if (!channel || !v.game.fleetMessageId) return;

  try {
    await channel.messages.edit(v.game.fleetMessageId, renderFleet(v));
  } catch (err) {
    log.error("fleet", "could not update the player's fleet", err);
  }
}
