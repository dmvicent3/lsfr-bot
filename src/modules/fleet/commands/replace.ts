import { playerShots, touch } from "../game.ts";
import type { FleetRepo } from "../store/repo.ts";
import type { Game } from "../types.ts";

/**
 * Clears the player's live game for a new one. No shot fired, or left waiting on jevos by the bot
 * (a restart mid-turn): gone with no result. Else a loss (abandoned). Runs under the player's lock.
 */
export function replaceOld(repo: FleetRepo, old: Game, now: number): "removed" | "abandoned" {
  if (playerShots(old) === 0 || touch(old, now) === "jevos") {
    repo.games.remove(old.guildId, old.playerId);

    return "removed";
  }

  repo.games.finish(old, { result: "loss", how: "abandoned", endedAt: now });

  return "abandoned";
}
