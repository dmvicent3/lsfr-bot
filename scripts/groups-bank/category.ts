import type { Member, Pick } from "./types.ts";

/** Members past this frequency rank only play when added by hand. */
export const MAX_RANK = 25_000;
/** Members whose category sense is further down their senses only play when added by hand. */
export const MAX_SENSE = 3;
const MIN_LENGTH = 3;
/** Fewer playable words than this and the category is left out. */
export const MIN_WORDS = 5;

/** A category before its level: playable words (most common first) and clash-only members. */
export interface Draft {
  name: string;
  words: Member[];
  also: string[];
  level?: number;
}

const playable = (m: Member, p: Pick): boolean =>
  (p.add ?? []).includes(m.word) ||
  (m.rank < MAX_RANK &&
    m.sense <= MAX_SENSE &&
    m.word.length >= MIN_LENGTH &&
    !(p.drop ?? []).includes(m.word));

/** The drops and adds that name no member: typos or stale allowlist entries. */
export function strays(p: Pick, members: Member[]): string[] {
  const known = new Set(members.map((m) => m.word));

  return [...(p.drop ?? []), ...(p.add ?? [])].filter((w) => !known.has(w));
}

/** Splits a category's members into playable words and clash-only ones; null when fewer than MIN_WORDS play. */
export function draftOf(p: Pick, members: Member[]): Draft | null {
  const words = members.filter((m) => playable(m, p));
  const also = members.filter((m) => !words.includes(m)).map((m) => m.word);

  if (words.length < MIN_WORDS) return null;

  return { name: p.name, words, also, ...(p.level === undefined ? {} : { level: p.level }) };
}
