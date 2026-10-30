import { expect, test } from "bun:test";
import { pageArgs } from "../../../../src/modules/trivia/components/page.ts";
import { pickReply, topicReply } from "../../../../src/modules/trivia/components/replies.ts";

test("pick replies", () => {
  expect(pickReply("locked", "B")).toBe("Locked in: B.");
  expect(pickReply("already", "C")).toBe("You already picked C.");
  expect(pickReply("closed", null)).toBe("This question is over.");
});

test("topic replies", () => {
  expect(topicReply("not-yours")).toBe("Not your pick.");
  expect(topicReply("over")).toBe("This choice is over.");
});

test("page args parse, anything unreadable is today's first page", () => {
  expect(pageArgs(["week", "3"])).toEqual({ period: "week", page: 3 });
  expect(pageArgs(["nope", "x"])).toEqual({ period: "today", page: 1 });
});
