import { normalize } from "../match.ts";
import type { Difficulty, Picture } from "../types.ts";
import { isBanned } from "./banned.ts";

/** One Wikidata result: the item, its English label, an image, its fame and alt labels. */
export interface PictureRow {
  qid: string;
  label: string;
  image: string;
  links: number;
  aliases: string[];
}

const LATIN = /^[\p{Script=Latin}\p{N}\p{P}\p{Zs}]+$/u;
const MIN_ALIAS = 3;

function cleanAliases(label: string, aliases: string[]): string[] {
  const answer = normalize(label);
  const kept = aliases.filter(
    (a) => a.length >= MIN_ALIAS && LATIN.test(a) && normalize(a) !== answer,
  );

  return [...new Set(kept)];
}

function firstPerItem(rows: PictureRow[]): PictureRow[] {
  const seen = new Set<string>();

  return rows.filter((r) => !seen.has(r.qid) && seen.add(r.qid));
}

/** Items whose photo would land badly in a casual game. */
const BLOCKED = new Set(["george floyd", "adolf hitler"]);

/** "Madame X (Virginie Gautreau)" → "Madame X". */
const shortLabel = (label: string): string =>
  label.replace(/\s*\([^)]*\)\s*/g, " ").trim() || label;

const THIRDS: Difficulty[] = ["easy", "medium", "hard"];
const SUFFIX = /^(jr|sr|i{1,3}|iv)\.?$/i;

/** "Martin Luther King Jr." → "King": what people call someone. */
const surname = (label: string): string =>
  label
    .split(" ")
    .filter((w) => !SUFFIX.test(w))
    .at(-1) ?? label;

/** Pictures for one category: one per item, most famous first, ids kept from `previous`. */
export function toPictures(p: {
  category: string;
  prompt: string;
  rows: PictureRow[];
  previous: ReadonlyMap<string, number>;
  nextId: () => number;
  /** Also accept the last word of the name (people, painters). */
  surnames?: boolean;
}): Picture[] {
  const rows = firstPerItem(p.rows)
    .filter((r) => !/^Q\d+$/.test(r.label))
    .filter((r) => !BLOCKED.has(normalize(r.label)))
    .filter((r) => !isBanned({ question: r.label, answer: r.label, wrong: r.aliases }))
    .toSorted((a, b) => b.links - a.links);

  return rows.map((r, i) => ({
    id: p.previous.get(`${p.category}:${r.qid}`) ?? p.nextId(),
    qid: r.qid,
    category: p.category,
    prompt: p.prompt,
    image: r.image,
    answer: shortLabel(r.label),
    aliases: cleanAliases(shortLabel(r.label), [
      ...r.aliases,
      r.label,
      ...(p.surnames ? [surname(shortLabel(r.label))] : []),
    ]),
    difficulty: THIRDS[Math.floor((i * 3) / rows.length)] ?? "hard",
  }));
}
