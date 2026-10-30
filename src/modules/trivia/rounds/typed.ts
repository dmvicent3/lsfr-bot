import { revealOrder } from "../hint.ts";
import { matches } from "../match.ts";
import { typedPoints } from "../scoring.ts";
import type { Question } from "../types.ts";
import type { Answer, TypedRound } from "./types.ts";

export const HINT_2_MS = 15_000;
export const HINT_3_MS = 30_000;
export const TYPED_MS = 45_000;

export function typedStart(
  question: Question,
  id: string,
  now: number,
  random: () => number,
): TypedRound {
  const order = revealOrder(question.answer, random);

  return {
    kind: "typed",
    id,
    question,
    startedAt: now,
    order,
    level: 0,
    award: null,
    closedAt: null,
  };
}

function levelAt(elapsed: number): 0 | 1 | 2 {
  if (elapsed >= HINT_3_MS) return 2;

  return elapsed >= HINT_2_MS ? 1 : 0;
}

/** Hints at 15 s and 30 s, the close at 45 s. */
export function typedTick(r: TypedRound, now: number): TypedRound {
  if (r.closedAt !== null) return r;

  const elapsed = now - r.startedAt;

  if (elapsed >= TYPED_MS) return { ...r, closedAt: now };

  const level = levelAt(elapsed);

  return level === r.level ? r : { ...r, level };
}

/** The first right answer wins the points of the current hint and closes the round. */
export function typedAnswer(round: TypedRound, a: Answer): TypedRound {
  const r = typedTick(round, a.at);

  if (r.closedAt !== null || !matches(a.text, r.question.answer)) return round;

  const award = {
    userId: a.userId,
    points: typedPoints(r.question.difficulty, r.level),
    ms: a.at - r.startedAt,
  };

  return { ...r, award, closedAt: a.at };
}
