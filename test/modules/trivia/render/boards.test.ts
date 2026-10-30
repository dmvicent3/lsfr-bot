import { expect, test } from "bun:test";
import { renderLeaderboard } from "../../../../src/modules/trivia/render/leaderboard.ts";
import { renderStats } from "../../../../src/modules/trivia/render/stats.ts";
import { kaosSummary, sessionSummary } from "../../../../src/modules/trivia/render/summary.ts";

const range = { from: "2026-10-26", to: "2026-11-01", label: "this week (26 Oct – 1 Nov)" };

test("leaderboard rows share ranks on equal points and name the viewer", () => {
  const list = [
    { userId: "a", points: 2_043 },
    { userId: "b", points: 1_034 },
    { userId: "c", points: 1_034 },
  ];
  const page = renderLeaderboard({ range, list, page: 1, viewerId: "c" });

  expect(page.content).toBe(
    [
      "## 🧠 Trivia — this week (26 Oct – 1 Nov)",
      "**1.** <@a> — 2,043 pts",
      "**2.** <@b> — 1,034 pts",
      "**2.** <@c> — 1,034 pts",
      "",
      "<@c>: #2 · 1,034 pts",
    ].join("\n"),
  );
});

test("an empty leaderboard says how to start", () => {
  expect(renderLeaderboard({ range, list: [], page: 1, viewerId: "c" }).content).toBe(
    "## 🧠 Trivia — this week (26 Oct – 1 Nov)\nNo points yet. Start with `/trivia start`.",
  );
});

test("pages of 10, clamped", () => {
  const list = Array.from({ length: 25 }, (_, i) => ({ userId: `u${i}`, points: 100 - i }));
  const page = renderLeaderboard({ range, list, page: 9, viewerId: "x" });

  expect(page).toMatchObject({ page: 3, pages: 3 });
  expect(page.content).toContain("**21.** <@u20>");
  expect(page.content).toContain("Page 3/3");
  expect(page.content).toContain("<@x> has no points this period.");
});

test("stats list every figure", () => {
  const text = renderStats({
    userId: "u",
    points: { today: 10, week: 40, month: 120, all: 1_034 },
    all: { points: 1_034, typedWins: 12, avgTypedMs: 12_340, bestTypedMs: 4_100, kaosItems: 7 },
    buttons: { right: 5, played: 9 },
    topics: 2,
  });

  expect(text).toBe(
    [
      "## 🧠 Trivia stats — <@u>",
      "Points: 10 today · 40 week · 120 month · 1,034 all time",
      "Typed answers won: 12 (average 12.3s, best 4.10s)",
      "Button rounds: 5 right of 9",
      "KAOS items: 7",
      "Topics picked: 2",
    ].join("\n"),
  );
});

test("stats with no typed wins skip the times", () => {
  const text = renderStats({
    userId: "u",
    points: { today: 0, week: 0, month: 0, all: 0 },
    all: { points: 0, typedWins: 0, avgTypedMs: null, bestTypedMs: null, kaosItems: 0 },
    buttons: { right: 0, played: 0 },
    topics: 0,
  });

  expect(text).toContain("Typed answers won: 0\n");
});

test("KAOS summary counts claims per player and lists misses", () => {
  expect(
    kaosSummary(
      [
        { name: "tyh", items: 3 },
        { name: "Mo", items: 1 },
      ],
      ["Austin"],
    ),
  ).toBe("KAOS over — tyh 3, Mo 1. Missed: Austin");
  expect(kaosSummary([{ name: "tyh", items: 4 }], [])).toBe("KAOS over — tyh 4. All found!");
  expect(kaosSummary([], ["A", "B"])).toBe("KAOS over — nobody scored. Missed: A, B");
});

test("session summary", () => {
  expect(
    sessionSummary(12, [
      { name: "tyh", points: 45 },
      { name: "Mo", points: 30 },
    ]),
  ).toBe("Trivia over after 12 rounds. Top: 1. tyh 45 · 2. Mo 30");
  expect(sessionSummary(3, [])).toBe("Trivia over after 3 rounds. Nobody scored.");
});
