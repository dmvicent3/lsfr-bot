import type { GroupsRepo } from "../store/repo.ts";
import type { Award, Game, Practice, Puzzle } from "../types.ts";

/** A player's round: the day's game or the practice puzzle. */
export type Rec = Game | Practice;

export interface Landed {
  game: Rec;
  award: Award | null;
}

/** One player's round at a moment: where to store it and the clock. */
export interface Turn {
  repo: GroupsRepo;
  rec: Rec;
  now: number;
}

/** Builds a puzzle; null when none could be generated. */
export type Make = () => Puzzle | null;

export const isGame = (rec: Rec): rec is Game => "date" in rec;
