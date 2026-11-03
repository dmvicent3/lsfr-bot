import type { CrosswordRepo } from "../store/repo.ts";
import { end } from "./round.ts";
import type { Landed, Rec } from "./types.ts";

/** Ends the round unsolved (0 points, the day still counts); a finished one stays as it is. */
export const giveUp = (repo: CrosswordRepo, rec: Rec, now: number): Landed =>
  rec.finishedAt === null ? end(repo, rec, false, now) : { game: rec, award: null };
