import { expect, test } from "bun:test";
import { newEntry, setup } from "../setup.ts";

test("an added entry reads back, unposted until attached", () => {
  const { repo } = setup();
  const id = repo.entries.add(newEntry());
  expect(repo.entries.get(id)).toMatchObject({ topic: "crossword", messageId: null, readAt: null });

  repo.entries.attach(id, "c1", "m1");
  expect(repo.entries.get(id)).toMatchObject({ channelId: "c1", messageId: "m1" });
});

test("list: unread and not removed by default, everything with all, by topic", () => {
  const { repo } = setup();
  const a = repo.entries.add(newEntry());
  const b = repo.entries.add(newEntry({ topic: "word" }));
  const c = repo.entries.add(newEntry());
  repo.entries.markRead([a], 2000);
  repo.entries.remove(c, 2000);

  const ids = (all: boolean, topic: string | null = null) =>
    repo.entries.list({ all, topic }).map((e) => e.id);

  expect(ids(false)).toEqual([b]);
  expect(ids(true)).toEqual([a, b, c]);
  expect(ids(true, "crossword")).toEqual([a, c]);
});

test("editing sets edited_at and makes a read entry unread again", () => {
  const { repo } = setup();
  const id = repo.entries.add(newEntry());
  repo.entries.markRead([id], 2000);
  repo.entries.edit(id, "Now easier", 3000);

  expect(repo.entries.get(id)).toMatchObject({ text: "Now easier", editedAt: 3000, readAt: null });
});

test("markRead counts what it marked, given ids or all unread", () => {
  const { repo } = setup();
  const a = repo.entries.add(newEntry());
  repo.entries.add(newEntry());
  repo.entries.add(newEntry());

  expect(repo.entries.markRead([a, 99], 2000)).toBe(1);
  expect(repo.entries.markRead("all", 3000)).toBe(2);
  expect(repo.entries.get(a)?.readAt).toBe(2000);
});
