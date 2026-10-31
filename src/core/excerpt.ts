import { matchWords } from "./terms.ts";

/** The part of a page about a query, and how well it matched (0 = not at all). */
export interface Excerpt {
  text: string;
  score: number;
}

/** Lines kept before the best match, for its heading. */
const LEAD = 3;
/** Lines after a match where a table counts in its favour (a results table under its title). */
const TABLE_REACH = 30;
const TABLE_CAP = 10;
/** One more query word matched outweighs a longer table... */
const WORD_WEIGHT = TABLE_CAP + 1;
/** ...but a table under a match is worth this many words: index pages and blurbs repeat the words. */
const TABLE_WORDS = 4;
const MIN_ROWS = 2;

const isRow = (line: string): boolean => line.includes(" | ");

/** How well each line matches: query words in it, then table rows just below it. */
function lineScores(lines: string[], words: string[]): number[] {
  return lines.map((line, i) => {
    const low = line.toLowerCase();
    const hits = words.filter((w) => low.includes(w)).length;

    if (hits === 0) return 0;

    const rows = lines.slice(i + 1, i + 1 + TABLE_REACH).filter(isRow).length;

    const table = rows >= MIN_ROWS ? TABLE_WORDS : 0;

    return (hits + table) * WORD_WEIGHT + Math.min(rows, TABLE_CAP);
  });
}

/** Up to `max` characters from the lines around the best match for the query; none when nothing matches. */
export function excerpt(text: string, query: string, max = 2500): Excerpt {
  const lines = text.split("\n");
  const scores = lineScores(lines, matchWords(query));
  const score = Math.max(0, ...scores);

  if (score === 0) return { text: "", score: 0 };

  const start = Math.max(0, scores.indexOf(score) - LEAD);

  return { text: lines.slice(start).join("\n").slice(0, max), score };
}
