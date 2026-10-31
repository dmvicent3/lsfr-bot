/** Words that say nothing about what is being looked up. */
const FILLER = new Set(
  (
    "a an and are about any can could current currently do does for from give how i in is it " +
    "me my now of on or please right show tell than that the this to was were what whats when " +
    "where which who will with would you your hey hi hello yo thanks thank lol ok okay gork pls " +
    "check some other recommend suggest find look search up also get let know see just maybe us"
  ).split(" "),
);

/** A text's lookup words: lowercase, at least 2 characters, no filler words, first use only. */
export function terms(text: string): string[] {
  const words = text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 2 && !FILLER.has(w));

  return [...new Set(words)];
}

/** The words a page or result is matched on: the lookup words plus their other spellings. */
export function matchWords(text: string): string[] {
  const words = terms(text);

  return [...new Set([...words, ...aliases(words)])];
}

/** Words written both ways: "free practice 2" and "FP2", "PM" and "prime minister", "F1" and "Formula 1". */
function aliases(words: string[]): string[] {
  const extra: string[] = [];

  if (words.includes("free") && words.includes("practice")) extra.push("fp");

  if (words.some((w) => /^fp\d$/.test(w))) extra.push("practice");

  if (words.includes("pm")) extra.push("prime minister");

  if (words.includes("f1")) extra.push("formula 1");

  return extra;
}
