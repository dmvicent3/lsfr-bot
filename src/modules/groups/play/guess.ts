import { GROUP_SIZE } from "../generate/pick.ts";
import { PER_MISTAKE } from "../scoring.ts";
import type { Progress } from "../types.ts";
import { fromHex } from "./hex.ts";
import { groupOf } from "./words.ts";

export const MAX_MISTAKES = 4;
export const ONE_AWAY = "One away…";
export const NOT_A_GROUP = "❌ Not a group";
export const REPEAT = "Already guessed — no mistake";

/** What a submit came to; `end` is set when it finishes the round. */
export interface Guessed<P extends Progress = Progress> {
  progress: P;
  end: "solved" | "lost" | null;
}

/** How many of the picked words share the most common group, and that group. */
function bestGroup(picked: number[]): { group: number; count: number } {
  const counts = picked.map((w) => picked.filter((v) => groupOf(v) === groupOf(w)).length);
  const at = counts.indexOf(Math.max(...counts));

  return { group: groupOf(picked[at] ?? 0), count: counts[at] ?? 0 };
}

const wrongLine = (oneAway: boolean, daily: boolean): string => {
  const base = oneAway ? ONE_AWAY : NOT_A_GROUP;

  return daily ? `${base} (−${PER_MISTAKE})` : base;
};

/** Judges the four picked words; null when four are not picked. A repeated wrong guess is free. */
export function guess<P extends Progress>(p: P, daily: boolean): Guessed<P> | null {
  const picked = fromHex(p.picked);

  if (picked.length !== GROUP_SIZE) return null;

  const { group, count } = bestGroup(picked);

  if (count === GROUP_SIZE) {
    const found = p.found + group.toString(16);

    return {
      progress: { ...p, picked: "", found, lastLine: null },
      end: found.length === 4 ? "solved" : null,
    };
  }

  const guesses = p.guesses ? p.guesses.split(",") : [];

  if (guesses.includes(p.picked)) return { progress: { ...p, lastLine: REPEAT }, end: null };

  const mistakes = p.mistakes + 1;
  const lastLine = wrongLine(count === GROUP_SIZE - 1, daily);
  const next = { ...p, mistakes, lastLine, guesses: [...guesses, p.picked].join(",") };

  return { progress: next, end: mistakes >= MAX_MISTAKES ? "lost" : null };
}
