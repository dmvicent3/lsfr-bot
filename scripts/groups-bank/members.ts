import { isOffensive } from "../crossword-words/gloss.ts";
import type { Member, NounNet, Synset } from "./types.ts";

/** What makes a lemma a member word: its frequency rank and the words never to use. */
export interface Lexicon {
  rank: Map<string, number>;
  blocked: Set<string>;
}

/** The synset `lemma.n.N` names (the N-th noun sense of the lemma); null when there is none. */
export function synsetOf(net: NounNet, id: string): Synset | null {
  const m = /^(.+)\.n\.(\d+)$/.exec(id);
  const offset = m ? net.senses.get(m[1]!)?.[Number(m[2]) - 1] : undefined;

  return offset ? (net.synsets.get(offset) ?? null) : null;
}

/** `lemma.n.N` of a synset, by its first lemma. */
export function idOf(net: NounNet, s: Synset): string {
  const lemma = (s.words[0] ?? "").toLowerCase();

  return `${lemma}.n.${(net.senses.get(lemma)?.indexOf(s.offset) ?? -1) + 1}`;
}

/** Every synset below `root` (hyponyms and instances, transitively), each once. */
export function below(net: NounNet, root: Synset): Synset[] {
  const seen = new Set([root.offset]);
  const out: Synset[] = [];
  const queue = [...root.hyponyms];

  for (let offset = queue.shift(); offset !== undefined; offset = queue.shift()) {
    const s = net.synsets.get(offset);

    if (!s || seen.has(offset)) continue;

    seen.add(offset);
    out.push(s);
    queue.push(...s.hyponyms);
  }

  return out;
}

/** An abbreviation such as `OH` or `NYC`. */
const isAbbreviation = (raw: string): boolean => /^[A-Z]{2,}$/.test(raw);

/** The single-word lemmas of a synset that are common and not blocked, as members. */
function wordsOf(net: NounNet, s: Synset, lex: Lexicon): Member[] {
  return s.words.flatMap((raw) => {
    const word = raw.toLowerCase();
    const rank = lex.rank.get(word);
    const bad = !/^[a-z]+$/.test(word) || isAbbreviation(raw) || lex.blocked.has(word);

    if (bad || rank === undefined) return [];

    const at = net.senses.get(word)?.indexOf(s.offset) ?? -1;

    return [{ word, rank, sense: at < 0 ? 99 : at + 1 }];
  });
}

/**
 * The member words of a category: lemmas of the synsets below `root` (not its own), skipping
 * offensive senses; a word in several synsets keeps its most common sense. Sorted by rank.
 */
export function membersOf(net: NounNet, root: Synset, lex: Lexicon): Member[] {
  const own = new Set(root.words.map((w) => w.toLowerCase()));
  const best = new Map<string, Member>();

  for (const s of below(net, root)) {
    if (isOffensive(s.gloss)) continue;

    for (const m of wordsOf(net, s, lex)) {
      const old = best.get(m.word);

      if (!own.has(m.word) && (!old || m.sense < old.sense)) best.set(m.word, m);
    }
  }

  return [...best.values()].toSorted((a, b) => a.rank - b.rank);
}
