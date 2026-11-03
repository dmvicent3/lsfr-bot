import { expect, test } from "bun:test";
import { setup } from "../setup.ts";

test("polls keep their options and multi flag, oldest first", () => {
  const { repo } = setup();
  const base = { guildId: "g", channelId: "c", messageId: "m", createdAt: 1, endsAt: 2 };
  const a = repo.polls.add({ ...base, question: "Q1", options: ["A", "B"], multi: true });
  const b = repo.polls.add({ ...base, question: "Q2", options: ["C", "D"], multi: false });

  expect(repo.polls.get(a)).toEqual({
    id: a,
    ...base,
    question: "Q1",
    options: ["A", "B"],
    multi: true,
  });
  expect(repo.polls.all().map((p) => p.id)).toEqual([a, b]);
  expect(repo.polls.get(99)).toBeNull();
});
