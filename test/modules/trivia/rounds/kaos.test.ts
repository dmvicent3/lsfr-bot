import { expect, test } from "bun:test";
import {
  kaosAnswer,
  kaosAwards,
  kaosStart,
  kaosTick,
} from "../../../../src/modules/trivia/rounds/kaos.ts";
import type { KaosList } from "../../../../src/modules/trivia/types.ts";

const T0 = 1_000_000;
const list: KaosList = {
  id: 535,
  prompt: "Capitals",
  items: [
    { answer: "Tallahassee" },
    { answer: "Washington, D.C.", aliases: ["DC"] },
    { answer: "Austin" },
  ],
};
const start = () => kaosStart(list, "k1", T0);
const say = (userId: string, text: string, ms: number) => ({ userId, text, at: T0 + ms });

test("a matching message claims the item", () => {
  const { round, claimed } = kaosAnswer(start(), say("tyh", "tallahasee", 2_000));

  expect(claimed).toBe(0);
  expect(round.claims[0]).toEqual({ userId: "tyh", at: T0 + 2_000 });
});

test("an item is claimed once", () => {
  const first = kaosAnswer(start(), say("a", "austin", 1_000)).round;
  const again = kaosAnswer(first, say("b", "Austin", 2_000));

  expect(again.claimed).toBeNull();
  expect(again.round.claims[2]?.userId).toBe("a");
});

test("aliases claim their item", () => {
  expect(kaosAnswer(start(), say("a", "dc", 1_000)).claimed).toBe(1);
});

test("claiming every item closes the round at once", () => {
  let r = start();

  for (const [i, text] of ["austin", "dc", "tallahassee"].entries()) {
    r = kaosAnswer(r, say("a", text, 1_000 * (i + 1))).round;
  }

  expect(r.closedAt).toBe(T0 + 3_000);
});

test("the hint comes at 30 s and the close at 60 s", () => {
  expect(kaosTick(start(), T0 + 29_999).hinted).toBe(false);
  expect(kaosTick(start(), T0 + 30_000).hinted).toBe(true);
  expect(kaosTick(start(), T0 + 60_000).closedAt).toBe(T0 + 60_000);
});

test("answers after the close or at 60 s claim nothing", () => {
  const closed = kaosTick(start(), T0 + 60_000);

  expect(kaosAnswer(closed, say("a", "austin", 61_000)).claimed).toBeNull();
  expect(kaosAnswer(start(), say("a", "austin", 60_000)).claimed).toBeNull();
});

test("each claim is a 10-point award naming its item", () => {
  const r = kaosAnswer(start(), say("a", "austin", 4_000)).round;

  expect(kaosAwards(r)).toEqual([{ userId: "a", points: 10, ms: 4_000, itemIndex: 2 }]);
});
