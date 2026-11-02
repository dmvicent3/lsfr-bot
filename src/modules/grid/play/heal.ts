import type { GridRepo } from "../store/repo.ts";
import { isOver } from "./answer.ts";
import { type Landed, type Rec, end } from "./round.ts";

/** Over but not finished: finish it here so it never renders as finished unsaved. */
export function healed(repo: GridRepo, rec: Rec, now: number): Landed {
  if (isOver(rec.cells, rec.guesses) && rec.finishedAt === null) return end(repo, rec, now);

  return { game: rec, award: null };
}
