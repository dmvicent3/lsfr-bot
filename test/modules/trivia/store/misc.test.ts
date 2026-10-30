import { expect, test } from "bun:test";
import { freshRepo } from "../fixtures.ts";

test("asked: the last ask per item, and the newest in a channel", () => {
  const repo = freshRepo();
  repo.asked.add({ guildId: "g", channelId: "c", kind: "question", itemId: 1, at: 10 });
  repo.asked.add({ guildId: "g", channelId: "c", kind: "question", itemId: 1, at: 30 });
  repo.asked.add({ guildId: "g", channelId: "c", kind: "kaos", itemId: 4, at: 20 });

  expect(repo.asked.lastAskedMap("g")).toEqual(
    new Map([
      ["question:1", 30],
      ["kaos:4", 20],
    ]),
  );
  expect(repo.asked.lastInChannel("c")).toEqual({ kind: "question", itemId: 1 });
  expect(repo.asked.lastInChannel("none")).toBeNull();
});

test("reports: open ones newest first", () => {
  const repo = freshRepo();
  repo.reports.add({
    guildId: "g",
    kind: "question",
    itemId: 1,
    userId: "u",
    reason: "typo",
    at: 1,
  });
  repo.reports.add({ guildId: "g", kind: "kaos", itemId: 2, userId: "v", reason: null, at: 2 });

  expect(repo.reports.open("g").map((r) => r.itemId)).toEqual([2, 1]);
});

test("topic picks are counted per player", () => {
  const repo = freshRepo();
  repo.topicPicks.add({ guildId: "g", userId: "u", category: "History", at: 1 });
  repo.topicPicks.add({ guildId: "g", userId: "u", category: "Sports", at: 2 });

  expect(repo.topicPicks.count("g", "u")).toBe(2);
  expect(repo.topicPicks.count("g", "v")).toBe(0);
});

test("button picks tally right and played", () => {
  const repo = freshRepo();
  repo.buttonPicks.add([
    { guildId: "g", userId: "u", questionId: 1, right: true, at: 1 },
    { guildId: "g", userId: "u", questionId: 2, right: false, at: 2 },
  ]);

  expect(repo.buttonPicks.tally("g", "u")).toEqual({ right: 1, played: 2 });
});
