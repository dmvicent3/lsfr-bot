import { readFileSync } from "node:fs";
import { glossOf } from "../crossword-words/gloss.ts";
import { parseIndexLine } from "../crossword-words/wndb.ts";
import type { NounNet, Synset } from "./types.ts";

/** Hyponym and instance-hyponym pointers. */
const DOWN = new Set(["~", "~i"]);

/** The hyponym offsets among the pointers that start at token `at` (their count). */
function downOf(t: string[], at: number): string[] {
  const hyponyms: string[] = [];

  for (let k = 0; k < Number(t[at]); k++) {
    const [sym, offset] = [t[at + 1 + 4 * k], t[at + 2 + 4 * k]];

    if (sym && offset && DOWN.has(sym)) hyponyms.push(offset);
  }

  return hyponyms;
}

/**
 * `offset lex_filenum ss_type w_cnt word lex_id [word lex_id]... p_cnt [sym offset pos st]... | gloss`;
 * `w_cnt` is hex. Licence lines start with a space.
 */
export function parseSynset(line: string): Synset | null {
  if (line.startsWith(" ")) return null;

  const bar = line.indexOf("|");
  const t = (bar < 0 ? line : line.slice(0, bar)).trim().split(/\s+/);
  const count = parseInt(t[3] ?? "", 16);

  if (!t[0] || !count) return null;

  const words = Array.from({ length: count }, (_, k) => t[4 + 2 * k] ?? "");
  const at = 4 + 2 * count;
  const hyponyms = downOf(t, at);

  return { offset: t[0], words, hyponyms, gloss: bar < 0 ? "" : glossOf(line.slice(bar + 1)) };
}

const lines = (path: string): string[] => readFileSync(path, "utf8").split(/\r?\n/);

/** The noun synsets by offset and each lemma's sense offsets, most common first. */
export function readNouns(dir: string): NounNet {
  const synsets = new Map<string, Synset>();
  const senses = new Map<string, string[]>();

  for (const s of lines(`${dir}/data.noun`).map(parseSynset)) {
    if (s) synsets.set(s.offset, s);
  }

  for (const e of lines(`${dir}/index.noun`).map(parseIndexLine)) {
    if (e) senses.set(e.lemma, e.offsets);
  }

  return { synsets, senses };
}
