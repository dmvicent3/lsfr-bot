import type { Game, Practice, Progress } from "../types.ts";
import type { GameRow, PracticeRow, ProgressRow } from "./types.ts";

const toProgress = (r: ProgressRow): Progress => ({
  order: r.word_order,
  picked: r.picked,
  found: r.found,
  guesses: r.guesses,
  mistakes: r.mistakes,
  lastLine: r.last_line,
});

export const PROGRESS = "word_order, picked, found, guesses, mistakes, last_line";
export const SET_PROGRESS =
  "word_order = ?, picked = ?, found = ?, guesses = ?, mistakes = ?, last_line = ?";

/** The progress columns' values, in `PROGRESS` order. */
export const progressValues = (p: Progress) => [
  p.order,
  p.picked,
  p.found,
  p.guesses,
  p.mistakes,
  p.lastLine,
];

export const solvedFlag = (solved: boolean | null): number | null =>
  solved === null ? null : Number(solved);

export const toGame = (r: GameRow): Game => ({
  guildId: r.guild_id,
  date: r.date,
  userId: r.user_id,
  ...toProgress(r),
  solved: r.solved === null ? null : r.solved === 1,
  points: r.points,
  streak: r.streak,
  startedAt: r.started_at,
  finishedAt: r.finished_at,
});

export const toPractice = (r: PracticeRow): Practice => ({
  guildId: r.guild_id,
  userId: r.user_id,
  puzzle: JSON.parse(r.puzzle),
  ...toProgress(r),
  startedAt: r.started_at,
  finishedAt: r.finished_at,
});
