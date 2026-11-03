import { expect, test } from "bun:test";
import { lcg } from "../../../../src/core/random.ts";
import { generate } from "../../../../src/modules/crossword/generate/generate.ts";
import { loadBankFile } from "../../../../src/modules/crossword/words/load.ts";

const bank = loadBankFile(
  new URL("../../../../src/modules/crossword/words/bank.json", import.meta.url),
);

function probe(size: 5 | 7, seeds: number): { ok: number; median: number; max: number } {
  const times: number[] = [];
  let ok = 0;

  for (let seed = 1; seed <= seeds; seed++) {
    const t0 = performance.now();
    const puzzle = generate({ bank, size, random: lcg(seed), avoid: new Set() });

    times.push(performance.now() - t0);

    if (puzzle) ok++;
  }

  times.sort((a, b) => a - b);

  return { ok, median: times[Math.floor(times.length / 2)]!, max: times[times.length - 1]! };
}

test("5x5 succeeds for at least 995 of 1000 seeds", () => {
  const r = probe(5, 1000);

  console.log(`5x5: ${r.ok}/1000 ok, median ${r.median.toFixed(1)} ms, max ${r.max.toFixed(0)} ms`);
  expect(r.ok).toBeGreaterThanOrEqual(995);
}, 120_000);

test("7x7 succeeds for at least 198 of 200 seeds", () => {
  const r = probe(7, 200);

  console.log(`7x7: ${r.ok}/200 ok, median ${r.median.toFixed(1)} ms, max ${r.max.toFixed(0)} ms`);
  expect(r.ok).toBeGreaterThanOrEqual(198);
}, 120_000);
