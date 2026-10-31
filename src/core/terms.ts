/** Words that say nothing about what is being looked up. */
const FILLER = new Set(
  (
    "a an and are about any can could current currently do does for from give how i in is it " +
    "me my now of on or please right show tell than that the this to was were what whats when " +
    "where which who will with would you your"
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
