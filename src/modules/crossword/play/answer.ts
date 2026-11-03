import type { Dir } from "../types.ts";
import { fill, isFull, solvedSlots } from "./cells.ts";
import type { Outcome, PlayState } from "./types.ts";

const DIRS: Record<Dir, string> = { a: "Across", d: "Down" };

/** "6 Across" */
export const slotName = (n: number, dir: Dir): string => `${n} ${DIRS[dir]}`;

/** Judges an answer for a slot without storing anything. */
export function submit(state: PlayState, slotIndex: number, text: string): Outcome {
  const { puzzle, cells } = state;
  const slot = puzzle.slots[slotIndex];
  const answer = puzzle.answers[slotIndex];

  if (state.finished || !slot || !answer) return { kind: "stale" };

  if (solvedSlots(puzzle, cells)[slotIndex]) return { kind: "solved-already" };

  const word = text.trim().toLowerCase();

  if (!/^[a-z]+$/.test(word) || word.length !== answer.length)
    return { kind: "bad", len: answer.length };

  if (word === answer) {
    const next = fill(cells, slot.cells, answer);

    return { kind: "hit", cells: next, done: isFull(next) };
  }

  const line = `❌ ${slotName(slot.n, slot.dir)}: not ${word.toUpperCase()}`;

  return { kind: "miss", line, wrong: state.wrong + 1 };
}
