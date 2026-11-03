import type { Award, Game, Practice, Puzzle } from "../types.ts";

/** What a move is judged against; callers persist the result. */
export interface PlayState {
  puzzle: Puzzle;
  cells: string;
  wrong: number;
  reveals: number;
  finished: boolean;
}

/** What one answer does. */
export type Outcome =
  | { kind: "stale" }
  | { kind: "solved-already" }
  | { kind: "bad"; len: number }
  | { kind: "miss"; line: string; wrong: number }
  | { kind: "hit"; cells: string; done: boolean };

/** A player's round: the day's game or the practice puzzle. */
export type Rec = Game | Practice;

export interface Landed {
  game: Rec;
  award: Award | null;
}

export const isGame = (rec: Rec): rec is Game => "date" in rec;
