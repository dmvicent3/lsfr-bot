import type { BankWord } from "../words/load.ts";

/** Words by length (key `len`) and by letter position (key `len:pos:letter`). */
export type WordIndex = Map<string, BankWord[]>;

function push(index: WordIndex, key: string, w: BankWord): void {
  const list = index.get(key);

  if (list) list.push(w);
  else index.set(key, [w]);
}

export function buildIndex(bank: BankWord[]): WordIndex {
  const index: WordIndex = new Map();

  for (const w of bank) {
    const len = w.word.length;

    push(index, String(len), w);

    for (let pos = 0; pos < len; pos++) push(index, `${len}:${pos}:${w.word[pos]}`, w);
  }

  return index;
}

/** Fixed letters of a slot: [position, letter] pairs. */
export type Fixed = [number, string][];

const shortest = (lists: BankWord[][]): BankWord[] =>
  lists.reduce((a, b) => (b.length < a.length ? b : a));

/** Unused words of `len` that carry every fixed letter. */
export function candidates(
  index: WordIndex,
  len: number,
  fixed: Fixed,
  used: Set<string>,
): BankWord[] {
  const lists = fixed.map(([pos, ch]) => index.get(`${len}:${pos}:${ch}`) ?? []);
  const base = lists.length ? shortest(lists) : index.get(String(len));

  if (!base) return [];

  return base.filter((w) => !used.has(w.word) && fixed.every(([pos, ch]) => w.word[pos] === ch));
}

/** One index per bank array, built on first use (the bank is fixed for the process). */
const indexes = new WeakMap<BankWord[], WordIndex>();

export function indexFor(bank: BankWord[]): WordIndex {
  let index = indexes.get(bank);

  if (!index) {
    index = buildIndex(bank);
    indexes.set(bank, index);
  }

  return index;
}
