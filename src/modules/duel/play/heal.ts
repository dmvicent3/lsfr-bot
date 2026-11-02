import type { DuelRepo } from "../store/repo.ts";
import type { Award, Game, Puzzle } from "../types.ts";
import { isDone } from "./answer.ts";
import { finish } from "./finish.ts";

/** Every answer but no finish: finish it here so it never renders as finished unsaved. */
export function healed(
  repo: DuelRepo,
  puzzle: Puzzle,
  g: Game,
  now: number,
): { game: Game; award: Award | null } {
  if (isDone(puzzle, g) && g.finishedAt === null) return finish(repo, puzzle, g, now);

  return { game: g, award: null };
}
