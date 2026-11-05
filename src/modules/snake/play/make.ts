import { daysBefore } from "../../../core/daily.ts";
import { seedFor } from "../../../core/seed.ts";
import { chooseWord } from "../../word/choose-word.ts";
import type { SnakeRepo } from "../store/repo.ts";
import { loadAnswers } from "../words/load.ts";
import type { Make } from "./types.ts";

/** Days back whose answers a daily avoids. */
export const AVOID_DAYS = 365;

const picked = (word: string): string | null => word || null;

/** The server's answer of a date: seeded by guild and date, avoiding the last year's answers. */
export function dailyMake(
  repo: SnakeRepo,
  v: { guildId: string; date: string },
  answers: readonly string[] = loadAnswers(),
): Make {
  return () => {
    const used = new Set(repo.puzzles.since(v.guildId, daysBefore(v.date, AVOID_DAYS), v.date));

    return picked(chooseWord(answers, used, seedFor(v.guildId, v.date)));
  };
}

/** A practice answer from the given random. */
export const practiceMake =
  (random: () => number, answers: readonly string[] = loadAnswers()): Make =>
  () =>
    picked(chooseWord(answers, new Set(), random));
