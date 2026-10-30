import { buttonPoints } from "../scoring.ts";
import { shuffle } from "../shuffle.ts";
import type { Question } from "../types.ts";
import type { Award, ButtonRound, Pick } from "./types.ts";

export const BUTTON_MS = 20_000;

/** True/false keeps its natural order; four options are shuffled. */
function optionsOf(q: Question, random: () => number): string[] {
  if (q.wrong.length === 1) return ["True", "False"];

  return shuffle([q.answer, ...q.wrong], random);
}

export function buttonStart(
  question: Question,
  p: { id: string; now: number; random: () => number; expected: string[] },
): ButtonRound {
  const options = optionsOf(question, p.random);

  return {
    kind: "button",
    id: p.id,
    question,
    startedAt: p.now,
    options,
    right: options.indexOf(question.answer),
    picks: [],
    expected: p.expected,
    closedAt: null,
  };
}

const allExpectedIn = (r: ButtonRound): boolean =>
  r.expected.length > 0 && r.expected.every((id) => r.picks.some((p) => p.userId === id));

/** One pick per player; the last expected player's pick closes the round. */
export function buttonPick(
  r: ButtonRound,
  pick: Pick,
): { round: ButtonRound; result: "locked" | "already" | "closed" } {
  if (buttonTick(r, pick.at).closedAt !== null) return { round: r, result: "closed" };

  if (r.picks.some((p) => p.userId === pick.userId)) return { round: r, result: "already" };

  const picked = { ...r, picks: [...r.picks, pick] };
  const round = allExpectedIn(picked) ? { ...picked, closedAt: pick.at } : picked;

  return { round, result: "locked" };
}

export function buttonTick(r: ButtonRound, now: number): ButtonRound {
  return r.closedAt === null && now - r.startedAt >= BUTTON_MS ? { ...r, closedAt: now } : r;
}

/** Every right pick scores by its speed; fastest first. */
export function buttonAwards(r: ButtonRound): Award[] {
  return r.picks
    .filter((p) => p.index === r.right)
    .map((p) => {
      const ms = p.at - r.startedAt;

      return { userId: p.userId, points: buttonPoints(r.question.difficulty, ms), ms };
    })
    .toSorted((a, b) => a.ms - b.ms);
}
