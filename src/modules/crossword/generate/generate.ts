import { FILLS, type FillOptions } from "./fillers.ts";
import { PATTERNS } from "./patterns.ts";
import { slotsOf } from "./slots.ts";
import type { Puzzle } from "../types.ts";

function shuffled<T>(items: T[], random: () => number): T[] {
  const out = [...items];

  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));

    [out[i], out[j]] = [out[j]!, out[i]!];
  }

  return out;
}

/** The pattern filled within its size's tries; null when every try hits the cap. */
function attempt(blocks: number[], o: FillOptions): Puzzle | null {
  const slots = slotsOf(o.size, blocks);
  const { fill, cap, tries } = FILLS[o.size];

  for (let t = 0; t < tries; t++) {
    const answers = fill(slots, o, cap);

    if (answers) return { size: o.size, blocks, slots, answers };
  }

  return null;
}

/** A filled grid from a random pattern, or null when every pattern fails. */
export function generate(o: FillOptions): Puzzle | null {
  for (const blocks of shuffled(PATTERNS[o.size], o.random)) {
    const puzzle = attempt(blocks, o);

    if (puzzle) return puzzle;
  }

  return null;
}
