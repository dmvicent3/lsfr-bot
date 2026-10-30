import { playerMoves, touch } from "../game.ts";
import { REPLACED } from "../store/finish.ts";
import type { FourRepo } from "../store/repo.ts";
import type { Game } from "../types.ts";

/**
 * Clears the player's live game for a new one. No disc dropped, or left waiting on jevos by the
 * bot (a restart mid-move): gone with no result. Idle 10 minutes → a loss (abandoned); else a
 * loss (replaced). Runs under the player's thinking lock.
 */
export function replaceOld(
  repo: FourRepo,
  old: Game,
  now: number,
): "removed" | "replaced" | "abandoned" {
  const state = touch(old, now);

  if (playerMoves(old) === 0 || state === "jevos") {
    repo.games.remove(old.guildId, old.playerId);

    return "removed";
  }

  if (state === "idle") {
    repo.games.finish(old, { result: "loss", how: "abandoned", endedAt: now });

    return "abandoned";
  }

  repo.games.finish(old, REPLACED(now));

  return "replaced";
}
