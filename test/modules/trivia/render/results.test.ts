import { expect, test } from "bun:test";
import {
  buttonResults,
  claimLine,
  ordinal,
  perkLine,
  rankAndGap,
  recordLine,
  winnerLine,
} from "../../../../src/modules/trivia/render/results.ts";

test("ordinals", () => {
  expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 101].map(ordinal)).toEqual([
    "1st",
    "2nd",
    "3rd",
    "4th",
    "11th",
    "12th",
    "13th",
    "21st",
    "22nd",
    "101st",
  ]);
});

test("rank and gap: equal points share the rank", () => {
  const list = [
    { userId: "a", points: 2_043 },
    { userId: "b", points: 1_034 },
    { userId: "c", points: 1_034 },
  ];

  expect(rankAndGap(list, "c")).toEqual({ rank: 2, gap: 1_009 });
  expect(rankAndGap(list, "a")).toEqual({ rank: 1, gap: 0 });
});

const totals = { today: 1_034, week: 1_034, month: 1_034 };

test("the winner line follows the screenshot", () => {
  expect(
    winnerLine({
      name: "tyh",
      answer: "permission",
      points: 5,
      ms: 17_550,
      rank: 5,
      gap: 1_009,
      totals,
    }),
  ).toBe(
    "**tyh** got it! The answer was: **permission**. +5 pts in 17.55s (5th, 1,009 pts behind leader) (1,034 today | 1,034 week | 1,034 month)",
  );
});

test("the leader is called the leader", () => {
  const line = winnerLine({
    name: "a",
    answer: "x",
    points: 10,
    ms: 1_000,
    rank: 1,
    gap: 0,
    totals,
  });

  expect(line).toContain("(leader)");
});

test("record lines", () => {
  expect(recordLine({ ms: 9_200, previous: { ms: 17_550, name: "X" }, improved: true })).toBe(
    "New record! 9.20s (was 17.55s by X)",
  );
  expect(recordLine({ ms: 17_550, previous: null, improved: true })).toBe(
    "First answer on record: 17.55s",
  );
  expect(recordLine({ ms: 9_000, previous: { ms: 4_100, name: "X" }, improved: false })).toBe(
    "Record: 4.10s by X",
  );
});

test("button results, fastest first, or nobody", () => {
  expect(
    buttonResults(
      [
        { name: "tyh", points: 14, ms: 3_100 },
        { name: "MurphysLaw", points: 11, ms: 9_800 },
      ],
      "Mars",
    ),
  ).toBe("✅ tyh +14 (3.1s), MurphysLaw +11 (9.8s) — the answer was **Mars**");
  expect(buttonResults([], "Mars")).toBe("Nobody got it — the answer was **Mars**.");
});

test("perk and claim lines", () => {
  expect(perkLine("tyh")).toBe("🎯 tyh was the only one right — they choose the next topic");
  expect(claimLine("tyh", "Tallahassee", 10)).toBe("✔ tyh: Tallahassee +10");
});
