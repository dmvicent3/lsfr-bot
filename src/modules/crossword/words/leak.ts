const SUFFIXES = ["ing", "es", "ed", "er", "ly", "s"];
const MIN_STEM = 3;

/** The word itself plus each trailing-suffix strip that leaves at least 3 letters. */
const forms = (word: string): Set<string> => {
  const out = new Set([word]);

  for (const suffix of SUFFIXES) {
    if (word.endsWith(suffix) && word.length - suffix.length >= MIN_STEM) {
      out.add(word.slice(0, -suffix.length));
    }
  }

  return out;
};

/** True when the clue text contains the answer, or an inflected form of it, as a whole word. */
export function leaks(text: string, word: string): boolean {
  const target = forms(word.toLowerCase());

  return text
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean)
    .some((t) => [...forms(t)].some((f) => target.has(f)));
}
