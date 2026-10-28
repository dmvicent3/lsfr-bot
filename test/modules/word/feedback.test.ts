import { expect, test } from "bun:test";
import { feedback } from "../../../src/modules/word/feedback.ts";

/** Marks as letters: h(it), n(ear), m(iss). */
const f = (guess: string, answer: string): string =>
  feedback(guess, answer)
    .map((m) => m[0])
    .join("");

test.each([
  ["crane", "crane", "hhhhh"],
  ["bumpy", "crane", "mmmmm"],
  ["speed", "abide", "mmnmn"],
  ["eerie", "there", "nmnmh"],
  ["allee", "apple", "hnmmh"],
  ["lolly", "hello", "mnhhm"],
])("%s vs %s", (guess, answer, expected) => expect(f(guess, answer)).toBe(expected));
