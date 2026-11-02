import { isOver } from "../play/answer.ts";
import { finish } from "../play/finish.ts";
import type { BoardView } from "../render/types.ts";
import type { GridRepo } from "../store/repo.ts";
import type { Award, Game, Grid, Practice } from "../types.ts";
import type { Round } from "./guard.ts";

type Rec = Game | Practice;
interface Landed {
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
export function land(r: Round, rec: Rec): Landed {
  if (isOver(rec.cells, rec.guesses)) return end(r.repo, rec, r.now);

  const saved = isGame(rec) ? r.repo.games.save(rec) : r.repo.practice.save(rec);

  return { game: saved ? rec : stored(r.repo, rec), award: null };
}

/** What the board shows for a round record. */
export function boardView(
  r: Pick<Round, "scope" | "number" | "untilNext">,
  grid: Grid,
  rec: Rec,
  award: Award | null = null,
): BoardView {
  return {
    scope: r.scope,
    number: r.number,
    grid,
    cells: rec.cells,
    guesses: rec.guesses,
    lastMiss: rec.lastMiss,
    points: rec.points ?? 0,
    finished: rec.finishedAt !== null,
    award,
    ...(r.untilNext === undefined ? {} : { untilNext: r.untilNext }),
  };
}
