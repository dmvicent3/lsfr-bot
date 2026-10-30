import { expect, test } from "bun:test";
import {
  blanksIn,
  fillPrompt,
  normalizeBlanks,
  validateCard,
} from "../../../src/modules/cards/text.ts";

test("runs of underscores become one blank each", () => {
  expect(normalizeBlanks("  I like ____ and   _____ ")).toBe("I like ___ and ___");
  expect(blanksIn("I like ___ and ___")).toBe(2);
});

test("a prompt needs one or two blanks and at most 150 characters", () => {
  expect(validateCard("prompt", "Why ____?")).toEqual({ ok: true, text: "Why ___?" });
  expect(validateCard("prompt", "No blank here")).toEqual({ ok: false, reason: "blanks" });
  expect(validateCard("prompt", "___ ___ ___")).toEqual({ ok: false, reason: "blanks" });
  expect(validateCard("prompt", `${"a".repeat(147)} ___`)).toEqual({ ok: false, reason: "length" });
});

test("an answer has no blanks and at most 80 characters", () => {
  expect(validateCard("answer", "A haunted Roomba")).toEqual({
    ok: true,
    text: "A haunted Roomba",
  });
  expect(validateCard("answer", "my ___")).toEqual({ ok: false, reason: "blanks" });
  expect(validateCard("answer", "a".repeat(81))).toEqual({ ok: false, reason: "length" });
  expect(validateCard("answer", "   ")).toEqual({ ok: false, reason: "empty" });
});

test("answers fill the blanks in bold, escaped, without their final period", () => {
  expect(fillPrompt("Why ___?", ["a *bold* cat."])).toBe("Why **a \\*bold\\* cat**?");
  expect(fillPrompt("___ beats ___.", ["Rock", "paper", "extra"])).toBe(
    "**Rock** beats **paper**.",
  );
});
