import { isStale, playerMoves } from "../game.ts";
import { REPLACED } from "../store/finish.ts";
import type { FourRepo } from "../store/repo.ts";
import type { Game } from "../types.ts";

/**
 * Clears the player's live game for a new one: stale → a loss (abandoned); a disc dropped → a
 * loss (replaced); untouched → gone with no result. Runs under the player's thinking lock.
 */
export function replaceOld(
  repo: FourRepo,
  old: Game,
  now: number,
): "removed" | "replaced" | "abandoned" {
  if (isStale(old, now, false)) {
    repo.games.finish(old, { result: "loss", how: "abandoned", endedAt: now });

    return "abandoned";
  }

  if (playerMoves(old) === 0) {
    repo.games.remove(old.guildId, old.playerId);

    return "removed";
  }

  repo.games.finish(old, REPLACED(now));

  return "replaced";
}
