import { describe, expect, test } from "bun:test";
import { clue } from "../../../../src/modules/snake/clue/clue.ts";
import { bestMatch } from "../../../../src/modules/snake/clue/match.ts";
import { show } from "./show.ts";

const of = (guess: string, answer: string): string => show(clue(guess, answer));

describe("clue against EXAMPLE", () => {
  test("PERMIT: E and M green, apart (earlier in the word than P·E); P yellow", () =>
    expect(of("permit", "example")).toBe("p? E r M i t"));

  test("IMPLY: M, P, L green and joined", () => expect(of("imply", "example")).toBe("i M=P=L y"));

  test("EXCUSE: E X joined from the start; the last E ends the word", () =>
    expect(of("excuse", "example")).toBe("(E=X c u s E)"));

  test("the answer itself: one bar, both caps", () =>
    expect(of("example", "example")).toBe("(E=X=A=M=P=L=E)"));

  test("a word with no shared letters is all dark", () =>
    expect(of("dog", "example")).toBe("d o g"));
});

/** The player's notation: dark letters as dots. */
const dots = (guess: string): string => of(guess, "college").replace(/[a-z](?!\?)/g, ".");

describe("against COLLEGE, the player's reference rows", () => {
  test("DAILY: only L", () => expect(dots("daily")).toBe(". . . L ."));

  test("MOLEST: E is plain green, on the middle E", () => {
    expect(dots("molest")).toBe(". O=L E . .");
    expect(bestMatch("molest", "college").at(-1)).toEqual({ g: 3, a: 4 });
  });

  test("PROLAPSE: its last letter ends the word", () =>
    expect(dots("prolapse")).toBe(". . O=L . . . E)"));

  test("COLGATE", () => expect(dots("colgate")).toBe("(C=O=L G . . E)"));

  test("COLLAGE", () => expect(dots("collage")).toBe("(C=O=L=L . G=E)"));

  test("COLLEGE: all joined, both caps", () => expect(dots("college")).toBe("(C=O=L=L=E=G=E)"));
});

describe("the matching's order of preference", () => {
  test("more green letters beat a joined pair", () =>
    // BÂ·AÂ·C (3 letters, none joined) beats the joined B=C of the 3rd and 4th letters.
    expect(of("babc", "bcaca")).toBe("(B A b C"));

  test("a joined pair beats matching both ends", () =>
    // A on 0 and B on 4 would match both ends; A=B on 3-4 is joined.
    expect(of("ab", "axxab")).toBe("A=B)"));

  test("an edge-to-edge match beats an earlier answer letter", () =>
    expect(of("ya", "aza")).toBe("y A)"));

  test("an answer end matched by a middle guess letter counts for nothing", () =>
    // The E could sit on the answer's last letter, but it is not the guess's last: earliest wins.
    expect(of("xex", "aeae")).toBe("x E x"));

  test("then the earliest answer letters", () => expect(of("ab", "abab")).toBe("(A=B"));

  test("then the earliest guess letter is the green one", () =>
    expect(of("aa", "xax")).toBe("A a"));
});

describe("yellow counts", () => {
  test("only as many yellows as the answer has unmatched copies, left to right", () =>
    // One B is left for the first of the two Bs; A is not the guess's first letter, so no cap.
    expect(of("bbaa", "abx")).toBe("b? b A a"));

  test("a letter used up by greens is dark elsewhere in the guess", () =>
    expect(of("lol", "lo")).toBe("(L=O l"));

  test("yellow when the copy is out of order", () => expect(of("ba", "ab")).toBe("b? A"));
});

describe("joins and caps", () => {
  test("neighbouring guess letters on non-neighbouring answer letters stay apart", () =>
    expect(of("ac", "abc")).toBe("(A C)"));

  test("neighbouring answer letters from non-neighbouring guess letters stay apart", () =>
    expect(of("axb", "ab")).toBe("(A x B)"));

  test("a short guess inside the word has no caps", () =>
    expect(of("amp", "example")).toBe("A=M=P"));

  test("a guess longer than the answer", () =>
    expect(of("examples", "example")).toBe("(E=X=A=M=P=L=E s"));

  test("only the guess's own first letter takes the start cap", () =>
    expect(of("xa", "ab")).toBe("x A"));

  test("only the guess's own last letter takes the end cap", () =>
    expect(of("bx", "ab")).toBe("B x"));
});
