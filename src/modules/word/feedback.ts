import type { Mark } from "./types.ts";

/** Hits first; then each other letter is near while the answer has an unmatched copy left. */
export function feedback(guess: string, answer: string): Mark[] {
  const marks: Mark[] = [...guess].map((c, i) => (answer[i] === c ? "hit" : "miss"));
  const left = new Map<string, number>();

  for (const [i, c] of [...answer].entries()) {
    if (marks[i] !== "hit") left.set(c, (left.get(c) ?? 0) + 1);
  }

  for (const [i, c] of [...guess].entries()) {
    const n = left.get(c) ?? 0;

    if (marks[i] === "hit" || n === 0) continue;

    marks[i] = "near";
    left.set(c, n - 1);
  }

  return marks;
}
