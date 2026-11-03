import { previousDate } from "../../../core/daily.ts";
import { seedFor } from "../../../core/seed.ts";
import { writeClues } from "../clues/write.ts";
import { generate } from "../generate/generate.ts";
import type { CrosswordRepo } from "../store/repo.ts";
import type { StoredPuzzle } from "../types.ts";
import { type BankWord, loadBank } from "../words/load.ts";

/** The LLM call that writes clues; null falls back to the definitions. */
export type Ask = NonNullable<Parameters<typeof writeClues>[1]>;

/** Builds a puzzle; null when no grid could be generated. */
export type Make = () => Promise<StoredPuzzle | null>;

interface Build {
  bank: BankWord[];
  size: 5 | 7;
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

/** The server's puzzle of a date: seeded by guild and date, avoiding the day before's answers. */
export function dailyMake(
  repo: CrosswordRepo,
  v: { guildId: string; date: string },
  ask: Ask | null,
): Make {
  return () => {
    const before = repo.puzzles.get(v.guildId, previousDate(v.date));
    const avoid = new Set(before?.puzzle.answers ?? []);
    const random = seedFor(v.guildId, v.date);

    return build({ bank: loadBank(), size: 5, random, avoid }, ask);
  };
}

/** A practice puzzle of a size from the given random. */
export const practiceMake =
  (size: 5 | 7, random: () => number, ask: Ask | null): Make =>
  () =>
    build({ bank: loadBank(), size, random, avoid: new Set() }, ask);
