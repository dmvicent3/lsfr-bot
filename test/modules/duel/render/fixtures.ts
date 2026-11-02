import type { Game, Puzzle, Question } from "../../../../src/modules/duel/types.ts";

const side = (iso2: string, name: string, value: number, year: number) => ({
  iso2,
  name,
  value,
  year,
});

const q = (a: ReturnType<typeof side>, b: ReturnType<typeof side>): Question => ({
  stat: "density",
  a,
  b,
  higher: a.value > b.value ? "a" : "b",
});

const nl = side("NL", "Netherlands", 521, 2023);
const be = side("BE", "Belgium", 383, 2023);

export const PUZZLE: Puzzle = {
  guildId: "g",
  date: "2026-11-05",
  questions: [q(nl, be), q(be, nl), q(nl, be), q(be, nl), q(nl, be)],
};

export const DIFF_YEARS: Question = q(nl, { ...be, year: 2021 });

export const game = (answers: string, over: Partial<Game> = {}): Game => ({
  guildId: "g",
  date: "2026-11-05",
  userId: "u1",
  answers,
  correct: null,
  points: null,
  streak: null,
  startedAt: 1,
  finishedAt: null,
  ...over,
});
