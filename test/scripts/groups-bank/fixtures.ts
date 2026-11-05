import type { Lexicon } from "../../../scripts/groups-bank/members.ts";
import type { Member, NounNet, Synset } from "../../../scripts/groups-bank/types.ts";

const synset = (
  offset: string,
  words: string[],
  hyponyms: string[] = [],
  gloss = "a thing",
): Synset => ({
  offset,
  words,
  hyponyms,
  gloss,
});

/** fish -> {trout, salmon -> {sockeye}, bass, Ling}, plus a slur-glossed member and a second `bass` sense. */
export function net(): NounNet {
  const all = [
    synset("01", ["fish"], ["02", "03", "05", "06", "07"]),
    synset("02", ["trout"]),
    synset("03", ["salmon"], ["04"]),
    synset("04", ["sockeye", "red_salmon"]),
    synset("05", ["bass", "BASS"]),
    synset("06", ["cod", "codfish"], [], "(ethnic slur) a rude word"),
    synset("07", ["pike", "fish"]),
    synset("10", ["bass", "basso"], [], "a low voice"),
  ];

  return {
    synsets: new Map(all.map((s) => [s.offset, s])),
    senses: new Map([
      ["fish", ["01"]],
      ["trout", ["02"]],
      ["salmon", ["03"]],
      ["sockeye", ["04"]],
      ["bass", ["10", "05"]],
      ["cod", ["06"]],
      ["pike", ["07"]],
    ]),
  };
}

export const lexicon = (blocked: string[] = []): Lexicon => ({
  rank: new Map([
    ["fish", 1],
    ["bass", 10],
    ["trout", 20],
    ["salmon", 30],
    ["cod", 40],
    ["pike", 50],
    ["sockeye", 30_000],
  ]),
  blocked: new Set(blocked),
});

export const member = (word: string, rank = 100, sense = 1): Member => ({ word, rank, sense });
