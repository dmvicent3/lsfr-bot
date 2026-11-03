import type { Game, Puzzle } from "../types.ts";

export interface PuzzleRow {
  guild_id: string;
  date: string;
  questions: string;
}

export interface GameRow {
  guild_id: string;
  date: string;
  user_id: string;
  answers: string;
  correct: number | null;
  points: number | null;
  streak: number | null;
  started_at: number;
  finished_at: number | null;
}

export const toPuzzle = (r: PuzzleRow): Puzzle => ({
  guildId: r.guild_id,
  date: r.date,
  questions: JSON.parse(r.questions),
});

export const toGame = (r: GameRow): Game => ({
  guildId: r.guild_id,
  date: r.date,
  userId: r.user_id,
  answers: r.answers,
  correct: r.correct,
  points: r.points,
  streak: r.streak,
  startedAt: r.started_at,
  finishedAt: r.finished_at,
});

export const COLUMNS =
  "guild_id, date, user_id, answers, correct, points, streak, started_at, finished_at";
export const MARKS = "?, ?, ?, ?, ?, ?, ?, ?, ?";
export const KEY = "guild_id = ? AND date = ? AND user_id = ?";

export const values = (g: Game) => [
  g.guildId,
  g.date,
  g.userId,
  g.answers,
  g.correct,
  g.points,
  g.streak,
  g.startedAt,
  g.finishedAt,
];
