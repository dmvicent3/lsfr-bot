import { log } from "../../../core/log.ts";
import type { Generated, Level } from "../types.ts";
import { dig } from "./dig.ts";
import { fill } from "./fill.ts";
import { grade } from "./grade.ts";
import { gridText } from "./grid.ts";

export const MAX_TRIES = 50;

const ORDER: Level[] = ["easy", "medium", "hard"];

const distance = (a: Level, b: Level): number => Math.abs(ORDER.indexOf(a) - ORDER.indexOf(b));

function attempt(random: () => number): Generated {
  const solution = fill(random);
  const givens = dig(solution, random);

  return { givens: gridText(givens), solution: gridText(solution), level: grade(givens) };
}

/** Retries until a puzzle grades as `level`; after MAX_TRIES returns the closest one seen. */
export function search(level: Level, random: () => number): { out: Generated; tries: number } {
  let best: Generated | undefined;

  for (let tries = 1; tries <= MAX_TRIES; tries++) {
    const out = attempt(random);

    if (out.level === level) return { out, tries };

    if (!best || distance(out.level, level) < distance(best.level, level)) best = out;
  }

  return { out: best!, tries: MAX_TRIES };
}

export function generate(level: Level, random: () => number): Generated {
  const { out } = search(level, random);

  if (out.level !== level) {
    log.info("sudoku", `wanted ${level}, got ${out.level} after ${MAX_TRIES} tries`);
  }

  return out;
}
