import type { TextBasedChannel } from "discord.js";
import { log } from "../../core/log.ts";
import type { Game } from "./types.ts";

/**
 * A game started before the board showed both grids still has its "Your fleet" message: deleted
 * (best effort) and its id cleared, so it happens once.
 */
export async function dropOldFleet(channel: TextBasedChannel | null, game: Game): Promise<Game> {
  if (!game.fleetMessageId) return game;

  try {
    await channel?.messages.delete(game.fleetMessageId);
  } catch (err) {
    log.error("fleet", "could not delete the old fleet message", err);
  }

  return { ...game, fleetMessageId: null };
}
