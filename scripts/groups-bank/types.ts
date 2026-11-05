/** One WordNet noun synset as the bank needs it. */
export interface Synset {
  offset: string;
  /** Its lemmas as written (case kept, `_` between words). */
  words: string[];
  /** Offsets of its hyponyms and instance hyponyms. */
  hyponyms: string[];
  gloss: string;
}

export interface NounNet {
  synsets: Map<string, Synset>;
  /** Lowercase lemma -> its noun sense offsets, most common first. */
  senses: Map<string, string[]>;
}

/** One allowlisted category: a synset as `lemma.n.N` (N-th noun sense), its display name. */
export interface Pick {
  id: string;
  name: string;
  /** Members never to put on a board (wrong sense, too obscure, misleading). */
  drop?: string[];
  /** Members to play although rare or a less common sense of the word. */
  add?: string[];
  /** A fixed level, when the computed one misjudges the category. */
  level?: number;
}

/** A member word of a category, with what difficulty needs. */
export interface Member {
  word: string;
  /** Position in the frequency list, 0 most common. */
  rank: number;
  /** 1-based position of the category's sense among the word's noun senses. */
  sense: number;
}
