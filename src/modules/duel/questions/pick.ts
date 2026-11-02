import { formatValue } from "../data/format.ts";
import { inBand, type Band } from "./bands.ts";
import type { Country, Question, Reading, Snapshot, StatDef } from "../types.ts";

const TRIES = 200;
/** Readings further apart than this make an unfair comparison. */
const MAX_YEAR_GAP = 3;

interface PickInput {
  snapshot: Snapshot;
  stat: StatDef;
  band: Band;
  used: Set<string>;
  recent: Set<string>;
  random: () => number;
}

export function pairKey(stat: string, x: string, y: string): string {
  return `${stat}:${[x, y].toSorted().join(":")}`;
}

/** The keys of every question in the given puzzles. */
export function recentKeys(puzzles: { questions: Question[] }[]): Set<string> {
  const keys = new Set<string>();

  for (const p of puzzles) {
    for (const q of p.questions) keys.add(pairKey(q.stat, q.a.iso2, q.b.iso2));
  }

  return keys;
}

function side(c: Country, r: Reading): Question["a"] {
  return { iso2: c.iso2, name: c.name, value: r.value, year: r.year };
}

/** Same shown value on both sides, or readings too far apart in time: not a fair question. */
function unfair(stat: StatDef, rx: Reading, ry: Reading): boolean {
  return (
    Math.abs(rx.year - ry.year) > MAX_YEAR_GAP ||
    formatValue(stat.id, rx) === formatValue(stat.id, ry)
  );
}

/** One random pair in the band, or null after 200 tries. */
export function pickPair(v: PickInput): Question | null {
  const { stat, random } = v;
  const pool = v.snapshot.countries.filter(
    (c) =>
      !v.used.has(c.iso2) && !stat.exclude.includes(c.iso2) && (c.values[stat.id]?.value ?? 0) > 0,
  );

  for (let t = 0; t < TRIES && pool.length > 1; t++) {
    const x = pool[Math.floor(random() * pool.length)]!;
    const y = pool[Math.floor(random() * pool.length)]!;
    const [rx, ry] = [x.values[stat.id]!, y.values[stat.id]!];
    const ratio = Math.max(rx.value, ry.value) / Math.min(rx.value, ry.value);

    if (x === y || !inBand(ratio, v.band) || v.recent.has(pairKey(stat.id, x.iso2, y.iso2)))
      continue;

    if (unfair(stat, rx, ry)) continue;

    const flip = random() < 0.5;
    const [a, b] = flip ? [side(y, ry), side(x, rx)] : [side(x, rx), side(y, ry)];

    return { stat: stat.id, a, b, higher: a.value > b.value ? "a" : "b" };
  }

  return null;
}
