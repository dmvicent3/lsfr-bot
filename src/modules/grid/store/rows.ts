import type { Game, Grid, Practice, Puzzle } from "../types.ts";

export interface PuzzleRow {
  guild_id: string;
  date: string;
  rows: string;
  cols: string;
  answers: string;
}

export interface GameRow {
  guild_id: string;
  date: string;
  user_id: string;
  cells: string;
  guesses: number;
  last_miss: string | null;
  filled: number | null;
  points: number | null;
  streak: number | null;
  started_at: number;
  finished_at: number | null;
}

export interface PracticeRow {
  guild_id: string;
  user_id: string;
  rows: string;
  cols: string;
  answers: string;
  cells: string;
  guesses: number;
  last_miss: string | null;
  points: number;
  started_at: number;
  finished_at: number | null;
}

const gridOf = (r: { rows: string; cols: string; answers: string }): Grid => ({
  rows: JSON.parse(r.rows),
  cols: JSON.parse(r.cols),
  answers: JSON.parse(r.answers),
});

export const gridJson = (g: Grid): [string, string, string] => [
  JSON.stringify(g.rows),
  JSON.stringify(g.cols),
  JSON.stringify(g.answers),
];

export const toPuzzle = (r: PuzzleRow): Puzzle => ({
  guildId: r.guild_id,
  date: r.date,
  grid: gridOf(r),
});

export const toGame = (r: GameRow): Game => ({
  guildId: r.guild_id,
  date: r.date,
  userId: r.user_id,
  cells: JSON.parse(r.cells),
  guesses: r.guesses,
  lastMiss: r.last_miss,
  filled: r.filled,
  points: r.points,
  streak: r.streak,
  startedAt: r.started_at,
  finishedAt: r.finished_at,
});

export const toPractice = (r: PracticeRow): Practice => ({
  guildId: r.guild_id,
  userId: r.user_id,
  grid: gridOf(r),
  cells: JSON.parse(r.cells),
  guesses: r.guesses,
  lastMiss: r.last_miss,
  points: r.points,
  startedAt: r.started_at,
  finishedAt: r.finished_at,
});

export const COLUMNS =
  "guild_id, date, user_id, cells, guesses, last_miss, filled, points, streak, started_at, finished_at";
export const MARKS = "?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?";
export const KEY = "guild_id = ? AND date = ? AND user_id = ?";

export const values = (g: Game) => [
  g.guildId,
  g.date,
  g.userId,
  JSON.stringify(g.cells),
  g.guesses,
  g.lastMiss,
  g.filled,
  g.points,
  g.streak,
  g.startedAt,
  g.finishedAt,
];
