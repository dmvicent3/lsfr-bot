import type { BankWord } from "../words/load.ts";

/** Common words first, but softly: the key is the square root of the rank times a draw. */
export function byRank(options: BankWord[], random: () => number): BankWord[] {
  const keyed = options.map((w) => ({ w, k: Math.sqrt(w.rank + 1) * random() }));

  return keyed.toSorted((a, b) => a.k - b.k).map((e) => e.w);
}
