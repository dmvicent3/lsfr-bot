import { RULES } from "../rules/catalogue.ts";
import type { RuleId } from "../types.ts";

export const MIN_CELL = 3;
export const MAX_CELL = 40;

function kinds(axis: RuleId[]): number {
  return new Set(axis.map((id) => RULES[id].kind)).size;
}

function groups(axis: RuleId[]): Set<string> {
  return new Set(axis.flatMap((id) => RULES[id].group ?? []));
}

/** Two kinds per axis, and no group shared between the two axes. */
export function axesOk(rows: RuleId[], cols: RuleId[]): boolean {
  if (kinds(rows) < 2 || kinds(cols) < 2) return false;

  const rowGroups = groups(rows);

  return ![...groups(cols)].some((g) => rowGroups.has(g));
}

export function cellsOk(answers: string[][]): boolean {
  return answers.every((a) => a.length >= MIN_CELL && a.length <= MAX_CELL);
}
