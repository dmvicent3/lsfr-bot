import { expect, test } from "bun:test";
import { shareText } from "../../../../src/modules/word/render/share.ts";

test("share text has no letters", () => {
  const t = shareText({
    userId: "u1",
    number: 12,
    guesses: ["crane", "crate"],
    answer: "crate",
    won: true,
  });
  expect(t).toBe("<@u1> solved Word #12 in 2/6\n🟩🟩🟩⬛🟩\n🟩🟩🟩🟩🟩");
  expect(t.toLowerCase()).not.toContain("crate");
});

test("a loss shows X/6", () => {
  const t = shareText({
    userId: "u1",
    number: 3,
    guesses: Array<string>(6).fill("bumpy"),
    answer: "crane",
    won: false,
  });
  expect(t).toStartWith("<@u1> missed Word #3 — X/6\n");
});
