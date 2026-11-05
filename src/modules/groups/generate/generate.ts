import { shuffle } from "../../trivia/shuffle.ts";
import { toHex } from "../play/hex.ts";
import type { Category, Group, Level, Puzzle } from "../types.ts";
import { membersOf, pickWords } from "./pick.ts";

export const LEVELS: Level[] = [0, 1, 2, 3];
const ATTEMPTS = 200;

export interface Options {
  bank: Category[];
  random: () => number;
  /** Category names not to use (the server's recent dailies). */
  avoid: Set<string>;
}

const pickOne = <T>(items: T[], random: () => number): T | undefined =>
  items[Math.floor(random() * items.length)];

/** One category per level, or null when a level has none left. */
function chooseCategories(o: Options): Category[] | null {
  const open = o.bank.filter((c) => !o.avoid.has(c.name));
  const chosen = LEVELS.map((l) =>
    pickOne(
      open.filter((c) => c.level === l),
      o.random,
    ),
  );

  return chosen.every((c) => c !== undefined) ? chosen : null;
}

/** Four words from each chosen category, none a member of another chosen one; null when stuck. */
function fill(chosen: Category[], random: () => number): Group[] | null {
  const members = chosen.map(membersOf);
  const groups: Group[] = [];

  for (const [i, c] of chosen.entries()) {
    const others = members.filter((_, j) => j !== i);
    const words = pickWords(c, others, groups.flatMap((g) => g.words), random);

    if (!words) return null;

    groups.push({ name: c.name, level: c.level, words });
  }

  return groups;
}

/** A board of four groups, one per level, sorted by level, with a shuffled order; null when none fits. */
export function generate(o: Options): Puzzle | null {
  for (let i = 0; i < ATTEMPTS; i++) {
    const chosen = chooseCategories(o);

    if (!chosen) return null;

    const groups = fill(chosen, o.random);

    if (groups) {
      const order = toHex(shuffle([...Array(16).keys()], o.random));

      return { groups, order };
    }
  }

  return null;
}
