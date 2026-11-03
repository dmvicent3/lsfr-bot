import type { Game, Practice, StoredPuzzle } from "../types.ts";

export interface PuzzleRow {
  puzzle: string;
  clues: string;
}

export interface GameRow {
  guild_id: string;
  date: string;
  user_id: string;
  cells: string;
  wrong: number;
  reveals: number;
  last_line: string | null;
  solved: number | null;
  points: number | null;
  streak: number | null;
  started_at: number;
  finished_at: number | null;
}

export interface PracticeRow extends PuzzleRow {
  guild_id: string;
  user_id: string;
  cells: string;
  wrong: number;
  reveals: number;
  last_line: string | null;
  started_at: number;
  finished_at: number | null;
}

export const toStored = (r: PuzzleRow): StoredPuzzle => ({
  puzzle: JSON.parse(r.puzzle),
  clues: JSON.parse(r.clues),
});

export const storedJson = (s: StoredPuzzle): [string, string] => [
  JSON.stringify(s.puzzle),
  JSON.stringify(s.clues),
];

export const solvedFlag = (solved: boolean | null): number | null =>
  solved === null ? null : Number(solved);

export const toGame = (r: GameRow): Game => ({
  guildId: r.guild_id,
  date: r.date,
  userId: r.user_id,
  cells: r.cells,
  wrong: r.wrong,
  reveals: r.reveals,
  lastLine: r.last_line,
  solved: r.solved === null ? null : r.solved === 1,
  points: r.points,
  streak: r.streak,
  startedAt: r.started_at,
  finishedAt: r.finished_at,
});

export const toPractice = (r: PracticeRow): Practice => ({
  guildId: r.guild_id,
  userId: r.user_id,
  ...toStored(r),
  cells: r.cells,
  wrong: r.wrong,
  reveals: r.reveals,
  lastLine: r.last_line,
  startedAt: r.started_at,
  finishedAt: r.finished_at,
});

export const COLUMNS =
  "guild_id, date, user_id, cells, wrong, reveals, last_line, solved, points, streak, started_at, finished_at";
export const MARKS = "?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?";
export const KEY = "guild_id = ? AND date = ? AND user_id = ?";
export const FINISHED =
  "SELECT * FROM crossword_games WHERE guild_id = ? AND finished_at IS NOT NULL";

export const values = (g: Game) => [
  g.guildId,
  g.date,
  g.userId,
  g.cells,
  g.wrong,
  g.reveals,
  g.lastLine,
  solvedFlag(g.solved),
  g.points,
  g.streak,
  g.startedAt,
  g.finishedAt,
];
