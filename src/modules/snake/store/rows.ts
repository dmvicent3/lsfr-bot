import type { Game, Practice } from "../types.ts";
import type { GameRow, PracticeRow } from "./types.ts";

/** Guesses as one column: lower-case words, comma-separated, oldest first. */
export const guessesText = (guesses: readonly string[]): string => guesses.join(",");

const guessesOf = (text: string): string[] => (text ? text.split(",") : []);

export const solvedFlag = (solved: boolean | null): number | null =>
  solved === null ? null : Number(solved);

export const toGame = (r: GameRow): Game => ({
  guildId: r.guild_id,
  date: r.date,
  userId: r.user_id,
  guesses: guessesOf(r.guesses),
  solved: r.solved === null ? null : r.solved === 1,
  points: r.points,
  streak: r.streak,
  startedAt: r.started_at,
  finishedAt: r.finished_at,
});

export const toPractice = (r: PracticeRow): Practice => ({
  guildId: r.guild_id,
  userId: r.user_id,
  answer: r.answer,
  guesses: guessesOf(r.guesses),
  startedAt: r.started_at,
  finishedAt: r.finished_at,
});
