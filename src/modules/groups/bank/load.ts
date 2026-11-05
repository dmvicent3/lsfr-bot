import { readFileSync } from "node:fs";
import type { Category } from "../types.ts";

const LEVELS = new Set([0, 1, 2, 3]);

const isWords = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((w) => typeof w === "string");

const isCategory = (v: unknown): v is Category =>
  typeof v === "object" &&
  v !== null &&
  "name" in v &&
  typeof v.name === "string" &&
  "level" in v &&
  LEVELS.has(Number(v.level)) &&
  "words" in v &&
  isWords(v.words) &&
  "also" in v &&
  isWords(v.also);

/** Uncached read of a bank file. */
export function loadBankFile(path: string | URL): Category[] {
  const raw: unknown = JSON.parse(readFileSync(path, "utf8"));

  if (!Array.isArray(raw) || !raw.every(isCategory))
    throw new Error(`bad groups bank: ${String(path)}`);

  return raw;
}

/** Once-per-process cache of the shipped bank. */
let cache: Category[] | null = null;

/** The shipped category bank, read once per process. */
export function loadBank(): Category[] {
  cache ??= loadBankFile(new URL("bank.json", import.meta.url));

  return cache;
}
