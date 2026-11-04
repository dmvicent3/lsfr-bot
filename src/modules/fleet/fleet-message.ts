import type { TextBasedChannel } from "discord.js";
import { log } from "../../core/log.ts";
import { fleetMessage } from "./board-message.ts";
import type { Game } from "./types.ts";

/**
 * While firing, the player's fleet sits in its own message under the board: posted the first
 * time (its id goes on the returned game), edited when `changed` (jevos fired, or the game
 * ended). Best effort: a failure leaves the board playable and is retried on the next change.
 */
export async function showFleet(
  channel: TextBasedChannel | null,
  game: Game,
  changed: boolean,
): Promise<Game> {
  if (game.phase !== "playing" || !channel?.isSendable()) return game;

  try {
    if (!game.fleetMessageId) {
      const sent = await channel.send(fleetMessage(game));

      return { ...game, fleetMessageId: sent.id };
    }

    if (changed) {
      await channel.messages.edit(game.fleetMessageId, { ...fleetMessage(game), attachments: [] });
    }
  } catch (err) {
    log.error("fleet", "could not show the player's fleet", err);
  }

  return game;
}
