import { expect, test } from "bun:test";
import { freshRepo } from "../fixtures.ts";

const s = { guildId: "g", channelId: "c", startedBy: "u", at: 1 };

test("a channel holds one live session at a time", () => {
  const repo = freshRepo();
  const id = repo.sessions.start(s);

  expect(id).toBeNumber();
  expect(repo.sessions.start({ ...s, startedBy: "v" })).toBeNull();
  expect(repo.sessions.start({ ...s, channelId: "other" })).toBeNumber();
});

test("ending is once; then the channel is free again", () => {
  const repo = freshRepo();
  const id = repo.sessions.start(s) ?? 0;

  expect(repo.sessions.end(id, 5)).toBe(true);
  expect(repo.sessions.end(id, 6)).toBe(false);
  expect(repo.sessions.start(s)).not.toBe(id);
});

test("endAllLive ends every live session", () => {
  const repo = freshRepo();
  repo.sessions.start(s);
  repo.sessions.start({ ...s, channelId: "c2" });

  expect(repo.sessions.endAllLive(9)).toBe(2);
  expect(repo.sessions.endAllLive(10)).toBe(0);
});
