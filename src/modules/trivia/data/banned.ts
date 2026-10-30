import { normalize } from "../match.ts";

/** Topics left out of the bank on request. */
const BANNED = ["pokemon"];

export function isBanned(q: { question: string; answer: string; wrong: string[] }): boolean {
  const text = normalize([q.question, q.answer, ...q.wrong].join(" "));

  return BANNED.some((word) => text.includes(word));
}
