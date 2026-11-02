/**
 * Times sudoku generation: 20 puzzles per level with Math.random.
 * Usage: bun scripts/sudoku-bench.ts
 */
import { MAX_TRIES, search } from "../src/modules/sudoku/generate/generate.ts";
import type { Level } from "../src/modules/sudoku/types.ts";

const LEVELS: Level[] = ["easy", "medium", "hard"];
const RUNS = 20;

const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;

for (const level of LEVELS) {
  const ms: number[] = [];
  const tries: number[] = [];
  let fallbacks = 0;

  for (let i = 0; i < RUNS; i++) {
    const start = performance.now();
    const r = search(level, Math.random);

    ms.push(performance.now() - start);
    tries.push(r.tries);

    if (r.out.level !== level) fallbacks++;
  }

  console.log(
    `${level}: mean ${mean(ms).toFixed(0)} ms, max ${Math.max(...ms).toFixed(0)} ms, ` +
      `mean tries ${mean(tries).toFixed(1)}, fallback ${fallbacks}/${RUNS} (limit ${MAX_TRIES})`,
  );
}
