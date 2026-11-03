import type { Kind, Level } from "../types.ts";

export interface PuzzleRow {
  guild_id: string;
  date: string;
  difficulty: Level;
  givens: string;
  solution: string;
}

export interface GameRow {
  guild_id: string;
  user_id: string;
  kind: Kind;
  date: string;
  slot: string;
  level: Level;
  givens: string;
  solution: string;
  cells: string;
  wrong: string;
  cursor: number;
  checks: number;
  started_at: number;
  solved_at: number | null;
  points: number | null;
  streak: number | null;
  notes: string;
  note_mode: number;
}
