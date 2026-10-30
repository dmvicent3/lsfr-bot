import { Database } from "bun:sqlite";
import { runMigrations } from "../../../src/core/db.ts";
import { triviaMigrations } from "../../../src/modules/trivia/store/migrations.ts";
import { TriviaRepo } from "../../../src/modules/trivia/store/repo.ts";
import type { KaosList, Question } from "../../../src/modules/trivia/types.ts";

export const question = (id: number, over: Partial<Question> = {}): Question => ({
  id,
  category: "General Knowledge",
  difficulty: "easy",
  question: `Question ${id}?`,
  answer: `answer${id}`,
  wrong: ["w1", "w2", "w3"],
  kind: "typed",
  ...over,
});

export const kaos = (
  id: number,
  answers: string[] = ["one", "two", "three", "four"],
): KaosList => ({
  id,
  prompt: `List ${id}`,
  items: answers.map((answer) => ({ answer })),
});

/** A random source that returns `values` in turn, then 0. */
export const scripted = (...values: number[]): (() => number) => {
  let i = 0;

  return () => values[i++] ?? 0;
};

export function freshRepo(): TriviaRepo {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, triviaMigrations);

  return new TriviaRepo(db);
}
