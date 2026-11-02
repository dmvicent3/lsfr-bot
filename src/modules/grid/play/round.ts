import type { GridRepo } from "../store/repo.ts";
import type { Award, Game, Practice } from "../types.ts";
import { isOver } from "./answer.ts";
import { finish } from "./finish.ts";

/** A player's round: the day's game or the practice grid. */
export type Rec = Game | Practice;

export interface Landed {
  game: Rec;
  award: Award | null;
}

export const isGame = (rec: Rec): rec is Game => "date" in rec;

const stored = (repo: GridRepo, rec: Rec): Rec =>
  (isGame(rec)
    ? repo.games.get(rec.guildId, rec.date, rec.userId)
    : repo.practice.get(rec.guildId, rec.userId)) ?? rec;

/** Finishes a round in one write; only a daily that was not yet finished has an award. */
export function end(repo: GridRepo, rec: Rec, now: number): Landed {
  if (isGame(rec)) return finish(repo, rec, now);

  const done = { ...rec, finishedAt: now };

  return { game: repo.practice.save(done) ? done : stored(repo, rec), award: null };
}

/** Stores a round after a guess; one that is now over is finished in the same write. */
export function land(repo: GridRepo, rec: Rec, now: number): Landed {
  if (isOver(rec.cells, rec.guesses)) return end(repo, rec, now);

  const saved = isGame(rec) ? repo.games.save(rec) : repo.practice.save(rec);

  return { game: saved ? rec : stored(repo, rec), award: null };
}
