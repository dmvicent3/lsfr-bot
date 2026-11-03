import type { CrosswordRepo } from "../store/repo.ts";
import type { Award, Game, Practice, Puzzle } from "../types.ts";

/** What a move is judged against; callers persist the result. */
export interface PlayState {
  puzzle: Puzzle;
  cells: string;
  wrong: number;
  reveals: number;
  finished: boolean;
}

/** What typing a word does: nothing (stale, bad) or new cells and a last line. */
export type Entry =
  | { kind: "stale" }
  | { kind: "bad"; len: number }
  | { kind: "entered"; cells: string; line: string | null };

/** One input of a cell's modal: the slot it writes and the raw text typed. */
export interface Typed {
  slot: number;
  text: string;
}

/** What a full grid is, once checked; `incomplete` while any cell is empty. */
export type Verdict = "incomplete" | "correct" | "wrong";

/** A player's round: the day's game or the practice puzzle. */
export type Rec = Game | Practice;

export interface Landed {
  game: Rec;
  award: Award | null;
}

/** One player's round at a moment: where to store it, the puzzle it plays, the clock. */
export interface Turn {
  repo: CrosswordRepo;
  rec: Rec;
  puzzle: Puzzle;
  now: number;
}

export const isGame = (rec: Rec): rec is Game => "date" in rec;
