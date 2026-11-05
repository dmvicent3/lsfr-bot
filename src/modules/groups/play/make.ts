import { daysBefore } from "../../../core/daily.ts";
import { seedFor } from "../../../core/seed.ts";
import { loadBank } from "../bank/load.ts";
import { generate } from "../generate/generate.ts";
import type { GroupsRepo } from "../store/repo.ts";
import type { Category } from "../types.ts";
import type { Make } from "./types.ts";

/** Days back whose categories a daily puzzle avoids. */
export const AVOID_DAYS = 30;

/** The server's puzzle of a date: seeded by guild and date, avoiding the last 30 days' categories. */
export function dailyMake(
  repo: GroupsRepo,
  v: { guildId: string; date: string },
  bank: Category[] = loadBank(),
): Make {
  return () => {
    const recent = repo.puzzles.since(v.guildId, daysBefore(v.date, AVOID_DAYS), v.date);
    const avoid = new Set(recent.flatMap((p) => p.groups.map((g) => g.name)));

    return generate({ bank, random: seedFor(v.guildId, v.date), avoid });
  };
}

/** A practice puzzle from the given random. */
export const practiceMake =
  (random: () => number, bank: Category[] = loadBank()): Make =>
  () =>
    generate({ bank, random, avoid: new Set() });
