import { shuffle } from "../../trivia/shuffle.ts";
import { STATS } from "../data/stats.ts";
import type { Question, Snapshot, StatDef } from "../types.ts";
import { BANDS, widen } from "./bands.ts";
import { pickPair } from "./pick.ts";
import { seedFor } from "./seed.ts";

interface Day {
  snapshot: Snapshot;
  guildId: string;
  date: string;
  recent: Set<string>;
}

interface Slot {
  n: number;
  day: Day;
  used: Set<string>;
  random: () => number;
}

function tryStat(stat: StatDef, s: Slot): Question | null {
  const bands = [BANDS[s.n], widen(s.n)];

  for (const band of bands) {
    if (!band) continue;

    const q = pickPair({
      snapshot: s.day.snapshot,
      stat,
      band,
      used: s.used,
      recent: s.day.recent,
      random: s.random,
    });

    if (q) return q;
  }

  return null;
}

/** Up to five questions for the day; fewer only when the data runs dry. */
export function generate(day: Day): Question[] {
  const random = seedFor(day.guildId, day.date);
  const queue = shuffle(STATS, random);
  const used = new Set<string>();
  const out: Question[] = [];

  for (let n = 0; n < BANDS.length; n++) {
    for (const stat of queue) {
      const q = tryStat(stat, { n, day, used, random });

      if (!q) continue;

      out.push(q);
      used.add(q.a.iso2).add(q.b.iso2);
      queue.splice(queue.indexOf(stat), 1);
      break;
    }
  }

  return out;
}
