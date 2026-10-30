import { expect, test } from "bun:test";
import { reportedLabel, renderReports } from "../../../../src/modules/trivia/commands/views.ts";
import { kaos, question } from "../fixtures.ts";

const lookup = {
  questions: [question(7, { question: "Capital of France?", answer: "Paris" })],
  lists: [kaos(3)],
};

test("reported labels name the item", () => {
  expect(reportedLabel({ kind: "question", itemId: 7 })).toBe("#7");
  expect(reportedLabel({ kind: "kaos", itemId: 3 })).toBe("#3 KAOS");
});

test("reports list the item, its answer and the reason, newest first as given", () => {
  const text = renderReports(
    [
      { guildId: "g", kind: "kaos", itemId: 3, userId: "v", reason: null, at: 2 },
      { guildId: "g", kind: "question", itemId: 7, userId: "u", reason: "typo", at: 1 },
    ],
    lookup,
  );

  expect(text).toBe(
    [
      "**#3 KAOS** List 3 — one, two, three, four (by <@v>)",
      "**#7** Capital of France? → Paris — “typo” (by <@u>)",
    ].join("\n"),
  );
});

test("no reports", () => {
  expect(renderReports([], lookup)).toBe("No reports.");
});
