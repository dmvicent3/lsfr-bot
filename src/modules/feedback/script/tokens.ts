import type { Tokens } from "./types.ts";

/** Which options take a value (repeatable) and which are bare flags. */
export interface FlagSpec {
  values: string[];
  flags: string[];
}

/** Splits the words after the command name; a string is what was wrong. */
export function tokenize(argv: string[], spec: FlagSpec): Tokens | string {
  const t: Tokens = { positional: [], values: new Map(), flags: new Set() };

  for (let n = 0; n < argv.length; n++) {
    const arg = argv[n] ?? "";
    const name = arg.slice(2);

    if (!arg.startsWith("--")) t.positional.push(arg);
    else if (spec.flags.includes(name)) t.flags.add(name);
    else if (!spec.values.includes(name)) return `Unknown option ${arg}.`;
    else {
      const value = argv[++n];

      if (value === undefined) return `${arg} needs a value.`;

      t.values.set(name, [...(t.values.get(name) ?? []), value]);
    }
  }

  return t;
}

/** The last value given for an option, or null. */
export const lastValue = (t: Tokens, name: string): string | null =>
  t.values.get(name)?.at(-1) ?? null;

/** A positive whole number, or null. */
export function positiveId(word: string): number | null {
  const n = Number(word);

  return /^\d+$/.test(word) && n > 0 ? n : null;
}
