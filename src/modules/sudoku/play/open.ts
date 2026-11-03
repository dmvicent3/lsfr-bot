import { generate } from "../generate/generate.ts";
import type { SudokuRepo } from "../store/repo.ts";
import type { Game, Level } from "../types.ts";
import { nextEmpty } from "./next-empty.ts";

interface Fresh {
  guildId: string;
  userId: string;
  level: Level;
  now: number;
  random: () => number;
}

const blank = (v: Fresh, givens: string, solution: string): Game => ({
  guildId: v.guildId,
  userId: v.userId,
  kind: "practice",
  date: "",
  slot: "",
  level: v.level,
  givens,
  solution,
  cells: givens,
  wrong: "0".repeat(81),
  cursor: nextEmpty(givens, 80),
  checks: 0,
  startedAt: v.now,
  solvedAt: null,
  points: null,
  streak: null,
  notes: "",
  noteMode: false,
  history: "",
});

/** The day's game for this level: the shared puzzle is generated on first open. */
export function openDaily(repo: SudokuRepo, v: Fresh & { date: string }): Game {
  const puzzle =
    repo.puzzles.get(v.guildId, v.date, v.level) ??
    repo.puzzles.create({ guildId: v.guildId, date: v.date, ...generate(v.level, v.random) });
  const base = blank(v, puzzle.givens, puzzle.solution);

  return repo.games.start({ ...base, kind: "daily", date: v.date, slot: v.level });
}

/** A fresh practice board, replacing the player's previous one. */
export function openPractice(repo: SudokuRepo, v: Fresh): Game {
  const { givens, solution } = generate(v.level, v.random);

  return repo.games.replace(blank(v, givens, solution));
}
