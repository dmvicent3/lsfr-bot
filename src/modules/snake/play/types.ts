import type { SnakeRepo } from "../store/repo.ts";
import type { Award, Game, Practice, Refusal } from "../types.ts";

/** A player's round: the day's game or the practice round. */
export type Rec = Game | Practice;

export interface Landed {
  game: Rec;
  award: Award | null;
}

/** One player's round at a moment: where to store it, its answer and the clock. */
export interface Turn {
  repo: SnakeRepo;
  rec: Rec;
  answer: string;
  now: number;
}

/** What a typed guess came to: refused (not counted), or played. */
export type Played = { kind: "refused"; reason: Refusal } | { kind: "played"; landed: Landed };

/** Picks an answer; null when there is none to pick. */
export type Make = () => string | null;

export const isGame = (rec: Rec): rec is Game => "date" in rec;
