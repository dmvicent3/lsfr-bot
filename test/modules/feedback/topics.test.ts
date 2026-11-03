import { expect, test } from "bun:test";
import type { BotModule } from "../../../src/core/types.ts";
import { feedbackTopics } from "../../../src/modules/feedback/topics.ts";

const mod = (...names: string[]): BotModule => ({
  name: names[0] ?? "x",
  commands: names.map((name) => ({ data: { name, description: "d" }, execute: async () => {} })),
});

test("the command names sorted, without help, feedback and dailies, then other", () => {
  const topics = feedbackTopics([mod("word", "sudoku"), mod("help"), mod("dailies"), mod("cards")]);

  expect(topics).toEqual(["cards", "sudoku", "word", "other"]);
  expect(feedbackTopics([mod("feedback"), { name: "chat" }])).toEqual(["other"]);
});

test("never more than Discord's 25 choices, other kept last", () => {
  const many = Array.from({ length: 40 }, (_, n) => mod(`game${String(n).padStart(2, "0")}`));
  const topics = feedbackTopics(many);

  expect(topics).toHaveLength(25);
  expect(topics.at(-1)).toBe("other");
  expect(topics[0]).toBe("game00");
});
