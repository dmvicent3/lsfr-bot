import { readFileSync } from "node:fs";

export interface BankWord {
  word: string;
  def: string;
  rank: number;
}

const isBankWord = (v: unknown): v is BankWord =>
  typeof v === "object" &&
  v !== null &&
  "word" in v &&
  typeof v.word === "string" &&
  "def" in v &&
  typeof v.def === "string" &&
  "rank" in v &&
  typeof v.rank === "number";

/** Uncached read of a bank file. */
export function loadBankFile(path: string | URL): BankWord[] {
  const raw: unknown = JSON.parse(readFileSync(path, "utf8"));

  if (!Array.isArray(raw) || !raw.every(isBankWord))
    throw new Error(`bad word bank: ${String(path)}`);

  return raw;
}

let cache: BankWord[] | null = null;

/** The shipped word bank, read once per process. */
export function loadBank(): BankWord[] {
  cache ??= loadBankFile(new URL("bank.json", import.meta.url));

  return cache;
}
