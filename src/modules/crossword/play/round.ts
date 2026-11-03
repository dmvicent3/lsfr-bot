import type { CrosswordRepo } from "../store/repo.ts";
import { isFull } from "./cells.ts";
import { finish } from "./finish.ts";
import { type Landed, type Rec, isGame } from "./types.ts";

const stored = (repo: CrosswordRepo, rec: Rec): Rec =>
  (isGame(rec)
    ? repo.games.get(rec.guildId, rec.date, rec.userId)
    : repo.practice.get(rec.guildId, rec.userId)) ?? rec;

/** Finishes a round in one write; only a daily that was not yet finished has an award. */
export function end(repo: CrosswordRepo, rec: Rec, solved: boolean, now: number): Landed {
  if (isGame(rec)) return finish(repo, rec, solved, now);

  const done = { ...rec, finishedAt: now };

  return { game: repo.practice.save(done) ? done : stored(repo, rec), award: null };
}

/** Stores a round after a move; one with every cell filled is finished in the same write. */
export function land(repo: CrosswordRepo, rec: Rec, now: number): Landed {
  if (isFull(rec.cells)) return end(repo, rec, true, now);

  const saved = isGame(rec) ? repo.games.save(rec) : repo.practice.save(rec);

  return { game: saved ? rec : stored(repo, rec), award: null };
}
