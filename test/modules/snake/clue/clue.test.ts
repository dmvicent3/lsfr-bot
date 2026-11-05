import { describe, expect, test } from "bun:test";
import { clue } from "../../../../src/modules/snake/clue/clue.ts";
import { show } from "./show.ts";

const of = (guess: string, answer: string): string => show(clue(guess, answer));

describe("clue against EXAMPLE", () => {
  test("PERMIT: P and E green, apart; E ends the word; M yellow", () =>
    expect(of("permit", "example")).toBe("P E) r m? i t"));

  test("IMPLY: M, P, L green and joined", () => expect(of("imply", "example")).toBe("i M=P=L y"));

  test("EXCUSE: E X joined from the start; the last E ends the word", () =>
    expect(of("excuse", "example")).toBe("(E=X c u s E)"));

  test("the answer itself: one bar, both caps", () =>
    expect(of("example", "example")).toBe("(E=X=A=M=P=L=E)"));

  test("a word with no shared letters is all dark", () =>
    expect(of("dog", "example")).toBe("d o g"));
});

describe("the matching's order of preference", () => {
  test("more green letters beat a joined pair", () =>
    // B·A·C (3 letters, none joined) beats the joined B=C of the 3rd and 4th letters.
    expect(of("babc", "bcaca")).toBe("(B A b C"));

  test("a joined pair beats matching both ends", () =>
    // A on 0 and B on 4 would match both ends; A=B on 3-4 is joined.
    expect(of("ab", "axxab")).toBe("A=B)"));

  test("an end matched beats an earlier answer letter", () => expect(of("a", "xaxa")).toBe("A)"));

  test("then the earliest guess letter is the green one", () =>
    expect(of("aa", "xax")).toBe("A a"));

  test("then the earliest answer letter", () => expect(of("ab", "abab")).toBe("(A=B"));
});

describe("yellow counts", () => {
  test("only as many yellows as the answer has unmatched copies, left to right", () =>
    // A starts the word; one B is left for the first of the two Bs.
    expect(of("bbaa", "abx")).toBe("b? b (A a"));

  test("a letter used up by greens is dark elsewhere in the guess", () =>
    expect(of("lol", "lo")).toBe("(L=O) l"));

  test("yellow when the copy is out of order", () => expect(of("ba", "ab")).toBe("B) a?"));
});

describe("joins and caps", () => {
  test("neighbouring guess letters on non-neighbouring answer letters stay apart", () =>
    expect(of("ac", "abc")).toBe("(A C)"));

  test("neighbouring answer letters from non-neighbouring guess letters stay apart", () =>
    expect(of("axb", "ab")).toBe("(A x B)"));

  test("a short guess inside the word has no caps", () =>
    expect(of("amp", "example")).toBe("A=M=P"));

  test("a guess longer than the answer", () =>
    expect(of("examples", "example")).toBe("(E=X=A=M=P=L=E) s"));
});
