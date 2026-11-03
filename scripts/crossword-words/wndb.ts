import { readFileSync } from "node:fs";
import { glossOf, pickGloss } from "./gloss.ts";

export type Pos = "n" | "v" | "a" | "r";

export interface IndexEntry {
  lemma: string;
  pos: Pos;
  senses: number;
  /** Synset offsets of the senses, most common first. */
  offsets: string[];
}

/** Tie-break order when parts of speech have equally many senses. */
const ORDER: Pos[] = ["n", "v", "a", "r"];
const FILES: Record<Pos, string> = { n: "noun", v: "verb", a: "adj", r: "adv" };
const POS: Record<string, Pos | undefined> = { n: "n", v: "v", a: "a", s: "a", r: "r" };

/** `lemma pos synset_cnt p_cnt [ptr]... sense_cnt tagsense_cnt offset...`; licence lines start with a space. */
export function parseIndexLine(line: string): IndexEntry | null {
  if (line.startsWith(" ")) return null;

  const t = line.trim().split(/\s+/);
  const senses = Number(t[2]);
  const offsets = t.slice(t.length - senses);
  const pos = POS[t[1] ?? ""];

  if (!t[0] || !pos || !senses || offsets.length !== senses) return null;

  return { lemma: t[0], pos, senses, offsets };
}

/** `offset lex_filenum ss_type ... | gloss`. */
export function parseDataLine(line: string): { offset: string; gloss: string } | null {
  if (line.startsWith(" ")) return null;

  const bar = line.indexOf("|");

  if (bar < 0) return null;

  return { offset: line.slice(0, 8), gloss: glossOf(line.slice(bar + 1)) };
}

const better = (a: IndexEntry, b: IndexEntry): boolean =>
  a.senses > b.senses || (a.senses === b.senses && ORDER.indexOf(a.pos) < ORDER.indexOf(b.pos));

/** Most senses wins; ties go by ORDER. */
export const pickEntry = (first: IndexEntry, ...rest: IndexEntry[]): IndexEntry =>
  rest.reduce((best, e) => (better(e, best) ? e : best), first);

const lines = (path: string): string[] => readFileSync(path, "utf8").split(/\r?\n/);

const glosses = (dir: string, pos: Pos): Map<string, string> =>
  new Map(
    lines(`${dir}/data.${FILES[pos]}`)
      .map(parseDataLine)
      .filter((d) => d !== null)
      .map((d) => [d.offset, d.gloss]),
  );

/** word -> gloss of the best sense of its richest part of speech (see pickGloss); single words only. */
export function readDefinitions(dir: string): Map<string, string> {
  const byLemma = new Map<string, IndexEntry[]>();

  for (const pos of ORDER) {
    for (const entry of lines(`${dir}/index.${FILES[pos]}`).map(parseIndexLine)) {
      if (entry && /^[a-z]+$/.test(entry.lemma)) {
        byLemma.set(entry.lemma, [...(byLemma.get(entry.lemma) ?? []), entry]);
      }
    }
  }

  const data = {
    n: glosses(dir, "n"),
    v: glosses(dir, "v"),
    a: glosses(dir, "a"),
    r: glosses(dir, "r"),
  };
  const out = new Map<string, string>();

  for (const [lemma, [head, ...rest]] of byLemma) {
    if (!head) continue;

    const best = pickEntry(head, ...rest);
    const gloss = pickGloss(best.offsets.map((o) => data[best.pos].get(o) ?? ""));

    if (gloss !== undefined) out.set(lemma, gloss);
  }

  return out;
}
