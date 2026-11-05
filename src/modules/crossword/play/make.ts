import { daysBefore } from "../../../core/daily.ts";
import { seedFor } from "../../../core/seed.ts";
import { writeClues } from "../clues/write.ts";
import { generate } from "../generate/generate.ts";
import type { CrosswordRepo } from "../store/repo.ts";
import type { Size, StoredPuzzle } from "../types.ts";
import { type BankWord, loadBank } from "../words/load.ts";

/** The LLM call that writes clues; null falls back to the definitions. */
export type Ask = NonNullable<Parameters<typeof writeClues>[1]>;

/** Builds a puzzle; null when no grid could be generated. */
export type Make = () => Promise<StoredPuzzle | null>;

interface Build {
  bank: BankWord[];
  size: Size;
  random: () => number;
  avoid: Set<string>;
}

/** A grid and its clues (the LLM's when valid, else the bank definitions). */
export async function build(o: Build, ask: Ask | null): Promise<StoredPuzzle | null> {
  const puzzle = generate(o);

  if (!puzzle) return null;

  const defs = new Map(o.bank.map((b) => [b.word, b.def]));
  const entries = puzzle.answers.map((word) => ({ word, def: defs.get(word) ?? word }));

  return { puzzle, clues: await writeClues(entries, ask) };
}

/** Days back whose answers a daily puzzle avoids. */
const AVOID_DAYS = 30;

/** The server's puzzle of a date: seeded by guild and date, avoiding the last 30 days' answers. */
export function dailyMake(
  repo: CrosswordRepo,
  v: { guildId: string; date: string },
  ask: Ask | null,
): Make {
  return () => {
    const recent = repo.puzzles.since(v.guildId, daysBefore(v.date, AVOID_DAYS), v.date);
    const avoid = new Set(recent.flatMap((s) => s.puzzle.answers));
    const random = seedFor(v.guildId, v.date);

    return build({ bank: loadBank(), size: 5, random, avoid }, ask);
  };
}

/** Sizes whose clues the LLM writes; 15×15's ~85 clues are the plain definitions. */
const LLM_CLUES: Record<Size, boolean> = { 5: true, 7: true, 15: false };

/** A practice puzzle of a size from the given random. */
export const practiceMake =
  (size: Size, random: () => number, ask: Ask | null): Make =>
  () =>
    build({ bank: loadBank(), size, random, avoid: new Set() }, LLM_CLUES[size] ? ask : null);
