import { normalize } from "../match.ts";
import type { Difficulty, Picture } from "../types.ts";
import { isBanned } from "./banned.ts";
import { cleanAliases, displayName, surname } from "./picture-names.ts";

/** One Wikidata result: the item, its English label, an image, its fame and alt labels. */
export interface PictureRow {
  qid: string;
  label: string;
  image: string;
  links: number;
  aliases: string[];
}

/** The first row per item; items whose rows disagree on the label (two creators) are left out. */
function onePerItem(rows: PictureRow[]): PictureRow[] {
  const labels = new Map<string, Set<string>>();

  for (const r of rows) labels.set(r.qid, (labels.get(r.qid) ?? new Set()).add(r.label));

  const seen = new Set<string>();

  return rows.filter((r) => labels.get(r.qid)?.size === 1 && !seen.has(r.qid) && seen.add(r.qid));
}

/** Items whose photo would land badly in a casual game. */
const BLOCKED = new Set([
  "george floyd",
  "adolf hitler",
  "benito mussolini",
  "mao zedong",
  "joseph stalin",
  "pol pot",
  "osama bin laden",
  "saddam hussein",
  "heinrich himmler",
  "joseph goebbels",
]);

/** So one painter's twenty paintings don't crowd the rest out. */
const PER_ANSWER = 3;

function capPerAnswer(rows: PictureRow[]): PictureRow[] {
  const count = new Map<string, number>();

  return rows.filter((r) => {
    const key = normalize(displayName(r.label));
    count.set(key, (count.get(key) ?? 0) + 1);

    return (count.get(key) ?? 0) <= PER_ANSWER;
  });
}

const THIRDS: Difficulty[] = ["easy", "medium", "hard"];

const kept = (rows: PictureRow[]): PictureRow[] =>
  capPerAnswer(
    onePerItem(rows)
      .filter((r) => !/^Q\d+$/.test(r.label))
      .filter((r) => !BLOCKED.has(normalize(r.label)))
      .filter((r) => !isBanned({ question: r.label, answer: r.label, wrong: r.aliases }))
      .toSorted((a, b) => b.links - a.links),
  );

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
  const rows = kept(p.rows);

  return rows.map((r, i) => {
    const answer = displayName(r.label);
    const extra = p.surnames ? [surname(answer)] : [];

    return {
      id: p.previous.get(`${p.category}:${r.qid}`) ?? p.nextId(),
      qid: r.qid,
      category: p.category,
      prompt: p.prompt,
      image: r.image,
      answer,
      aliases: cleanAliases(answer, [...r.aliases, r.label, ...extra]),
      difficulty: THIRDS[Math.floor((i * 3) / rows.length)] ?? "hard",
    };
  });
}
