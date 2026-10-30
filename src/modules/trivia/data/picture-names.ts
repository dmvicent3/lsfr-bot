import { normalize } from "../match.ts";

const LATIN = /^[\p{Script=Latin}\p{N}\p{P}\p{Zs}]+$/u;
const MIN_ALIAS = 3;
const SUFFIX = /^(jr|sr|i{1,3}|iv)\.?$/i;
/** "Kingdom of the Netherlands" → "Netherlands"; "Democratic Republic of …" stays whole. */
const FORMAL =
  /^(?:(?:People's|Islamic|Federal|Socialist|Arab|Grand) )?(?:Kingdom|Republic|State|Commonwealth|Federation|Principality|Duchy|Sultanate|Emirate) of (?:the )?(.+)$/;

/** Alt labels worth accepting: 3+ characters, Latin script, not the answer itself, once each. */
export function cleanAliases(answer: string, aliases: string[]): string[] {
  const own = normalize(answer);
  const kept = aliases.filter(
    (a) => a.length >= MIN_ALIAS && LATIN.test(a) && normalize(a) !== own,
  );

  return [...new Set(kept)];
}

/** The name players see: "Madame X (Virginie Gautreau)" → "Madame X", "Kingdom of Denmark" → "Denmark". */
export function displayName(label: string): string {
  const short = label.replace(/\s*\([^)]*\)\s*/g, " ").trim() || label;

  return FORMAL.exec(short)?.[1] ?? short;
}

/** "Martin Luther King Jr." → "King": what people call someone. */
export const surname = (name: string): string =>
  name
    .split(" ")
    .filter((w) => !SUFFIX.test(w))
    .at(-1) ?? name;
