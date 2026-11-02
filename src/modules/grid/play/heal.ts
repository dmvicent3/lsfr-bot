import type { GridRepo } from "../store/repo.ts";
import type { Award, Game } from "../types.ts";
import { isOver } from "./answer.ts";
import { finish } from "./finish.ts";

/** Over but not finished: finish it here so it never renders as finished unsaved. */
export function healed(repo: GridRepo, g: Game, now: number): { game: Game; award: Award | null } {
  if (isOver(g.cells, g.guesses) && g.finishedAt === null) return finish(repo, g, now);

  return { game: g, award: null };
}
