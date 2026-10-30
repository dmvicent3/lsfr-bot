import { expect, test } from "bun:test";
import { ButtonStyle } from "discord.js";
import { buttonMessage, typedMessage } from "../../../../src/modules/trivia/render/question.ts";
import {
  buttonPick,
  buttonStart,
  buttonTick,
} from "../../../../src/modules/trivia/rounds/button.ts";
import { typedStart, typedTick } from "../../../../src/modules/trivia/rounds/typed.ts";
import { question } from "../fixtures.ts";

const q = question(1234, { category: "Science: Computers", answer: "New York" });

test("a typed question shows its title, text and the masked hint", () => {
  const [embed] = typedMessage(
    typedStart(q, "r", 0, () => 0),
    null,
  ).embeds;

  expect(embed?.title).toBe("#1234 · Science: Computers · easy");
  expect(embed?.description).toBe("Question 1234?\n\nHINT: `*** ****`");
});

test("time's up shows the answer", () => {
  const [embed] = typedMessage(
    typedTick(
      typedStart(q, "r", 0, () => 0),
      45_000,
    ),
    null,
  ).embeds;

  expect(embed?.description).toContain("Time's up — the answer was: **New York**");
});

test("a won question shows the answer", () => {
  const r = {
    ...typedStart(q, "r", 0, () => 0),
    closedAt: 5,
    award: { userId: "u", points: 10, ms: 5 },
  };

  expect(typedMessage(r, null).embeds[0]?.description).toContain("Answer: **New York**");
});

test("a picked topic is credited", () => {
  const [embed] = typedMessage(
    typedStart(q, "r", 0, () => 0),
    "tyh",
  ).embeds;

  expect(embed?.footer?.text).toBe("Topic picked by tyh");
});

const choice = question(2071, {
  kind: "choice",
  category: "History",
  difficulty: "medium",
  answer: "Mars",
  wrong: ["Venus", "x".repeat(100), "Moon"],
});

test("a button question lists lettered buttons, cut to 80 characters", () => {
  const r = buttonStart(choice, { id: "b9", now: 0, random: () => 0, expected: [] });
  const msg = buttonMessage(r, null);
  const buttons = msg.components[0]?.components ?? [];

  expect(msg.embeds[0]?.title).toBe("#2071 · History · medium · 20s");
  expect(buttons.map((b) => b.custom_id)).toEqual([
    "trivia:pick:b9:0",
    "trivia:pick:b9:1",
    "trivia:pick:b9:2",
    "trivia:pick:b9:3",
  ]);
  expect(buttons.every((b) => b.label !== undefined && b.label.length <= 80)).toBe(true);
  expect(buttons[0]?.label?.startsWith("A: ")).toBe(true);
});

test("a closed button question greens the answer, counts picks and disables all", () => {
  let r = buttonStart(choice, { id: "b9", now: 0, random: () => 0, expected: [] });
  r = buttonPick(r, { userId: "u", index: r.right, at: 1_000 }).round;
  r = buttonTick(r, 20_000);
  const buttons = buttonMessage(r, null).components[0]?.components ?? [];

  expect(buttons.every((b) => b.disabled)).toBe(true);
  expect(buttons[r.right]?.style).toBe(ButtonStyle.Success);
  expect(buttons[r.right]?.label?.endsWith(" · 1")).toBe(true);
  expect(buttons.filter((b) => b.style === ButtonStyle.Secondary)).toHaveLength(3);
});
