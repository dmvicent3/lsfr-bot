import type { GridRepo } from "../store/repo.ts";
import { type Landed, type Rec, end } from "./round.ts";

/** Ends the round with what is filled so far; a finished one stays as it is. */
export const giveUp = (repo: GridRepo, rec: Rec, now: number): Landed =>
  rec.finishedAt === null ? end(repo, rec, now) : { game: rec, award: null };
