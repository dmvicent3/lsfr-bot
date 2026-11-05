import { describe, expect, test } from "bun:test";
import { checkGuess, refusalText } from "../../../../src/modules/snake/play/validate.ts";

const words = new Set(["ox", "plan", "planet", "everything"]);
const ctx = { accepted: () => words, guesses: ["plan"], finished: false };

describe("checkGuess", () => {
  test("a known word of 2–10 letters, trimmed and lower-cased", () => {
    expect(checkGuess("  PlaNet ", ctx)).toEqual({ ok: true, word: "planet" });
    expect(checkGuess("ox", ctx)).toEqual({ ok: true, word: "ox" });
    expect(checkGuess("everything", ctx)).toEqual({ ok: true, word: "everything" });
  });

  test("refusals, in order", () => {
    expect(checkGuess("planet", { ...ctx, finished: true })).toEqual({
      ok: false,
      reason: "finished",
    });
    expect(checkGuess("plan-et", ctx)).toEqual({ ok: false, reason: "letters" });
    expect(checkGuess("two words", ctx)).toEqual({ ok: false, reason: "letters" });
    expect(checkGuess("a", ctx)).toEqual({ ok: false, reason: "length" });
    expect(checkGuess("abcdefghijk", ctx)).toEqual({ ok: false, reason: "length" });
    expect(checkGuess("planed", ctx)).toEqual({ ok: false, reason: "unknown" });
    expect(checkGuess("PLAN", ctx)).toEqual({ ok: false, reason: "repeat" });
  });

  test("a length with no list is unknown", () =>
    expect(checkGuess("planet", { ...ctx, accepted: () => null })).toEqual({
      ok: false,
      reason: "unknown",
    }));
});

test("every refusal has a text, and none says it was counted", () => {
  for (const r of ["finished", "letters", "length", "unknown", "repeat"] as const) {
    expect(refusalText(r).length).toBeGreaterThan(5);
  }

  expect(refusalText("unknown")).toContain("Not counted");
});
