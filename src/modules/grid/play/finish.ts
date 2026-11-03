import { streakOf } from "../../../core/daily.ts";
import type { Snapshot } from "../../../core/countries/types.ts";
import { award, cellPoints, obscurity } from "../scoring.ts";
import type { GridRepo } from "../store/repo.ts";
import type { Award, Game } from "../types.ts";

/**
 * Scores a completed game; the award is null when it was already finished. While a game is
 * played its points hold the running cell total; finishing replaces it with the final points.
 */
export function finish(repo: GridRepo, g: Game, now: number): { game: Game; award: Award | null } {
  const filled = g.cells.filter((c) => c !== "").length;
  const streak = streakOf(repo.games, g);
  const won = award(g.points ?? 0, filled, streak);
  const game = { ...g, filled, streak, points: won.points, finishedAt: now };

  if (repo.games.save(game)) return { game, award: won };

  return { game: repo.games.get(g.guildId, g.date, g.userId) ?? game, award: null };
}

/**
 * The award parts of a finished daily, rebuilt from the stored cells and streak, so a revisit
 * shows the same breakdown and total as the finishing click did.
 */
export function recap(g: Game, snapshot: Snapshot): Award {
  const obs = obscurity(snapshot);
  const filled = g.cells.filter((c) => c !== "");
  const total = filled.reduce((sum, iso2) => sum + cellPoints(iso2, obs.get(iso2) ?? 1), 0);

  return award(total, filled.length, g.streak ?? 1);
}
