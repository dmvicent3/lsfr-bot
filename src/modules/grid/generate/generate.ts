import type { Snapshot } from "../../../core/countries/types.ts";
import { RULE_IDS } from "../rules/catalogue.ts";
import type { Grid, RuleId } from "../types.ts";
import { axesOk, cellsOk } from "./constraints.ts";
import { validFor } from "./valid.ts";

export const MAX_ATTEMPTS = 500;

interface Options {
  snapshot: Snapshot;
  random: () => number;
  avoid: readonly RuleId[];
}

/** Partial Fisher-Yates: `count` distinct picks. */
function pick(pool: RuleId[], count: number, random: () => number): RuleId[] {
  const copy = [...pool];

  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(random() * (copy.length - i));

    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }

  return copy.slice(0, count);
}

function answersFor(snapshot: Snapshot, rows: RuleId[], cols: RuleId[]): string[][] {
  return rows.flatMap((r) => cols.map((c) => validFor(snapshot, r, c)));
}

export function generateGrid({ snapshot, random, avoid }: Options): Grid | null {
  const pool = RULE_IDS.filter((id) => !avoid.includes(id));

  if (pool.length < 6) return null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const six = pick(pool, 6, random);
    const rows = six.slice(0, 3);
    const cols = six.slice(3);

    if (!axesOk(rows, cols)) continue;

    const answers = answersFor(snapshot, rows, cols);

    if (cellsOk(answers)) return { rows, cols, answers };
  }

  return null;
}
