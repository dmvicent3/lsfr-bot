import { shuffle } from "../../trivia/shuffle.ts";
import type { Grid } from "../types.ts";
import { countSolutions } from "./count.ts";

const LAST = 80;

/** Cell pairs (i, 80 - i) in half-turn symmetry; the centre is its own pair. */
const PAIRS: readonly number[] = Array.from({ length: 41 }, (_, i) => i);

/** Empties symmetric cell pairs in random order while the solution stays unique. */
export function dig(solution: Grid, random: () => number): Grid {
  const g = [...solution];

  for (const i of shuffle(PAIRS, random)) {
    const [a, b] = [g[i]!, g[LAST - i]!];

    g[i] = 0;
    g[LAST - i] = 0;

    if (countSolutions(g, 2) === 1) continue;

    g[i] = a;
    g[LAST - i] = b;
  }

  return g;
}
