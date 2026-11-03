import { expect, test } from "bun:test";
import {
  entriesText,
  pollsText,
  resultsText,
} from "../../../../src/modules/feedback/script/format.ts";
import type { Entry, StoredPoll } from "../../../../src/modules/feedback/types.ts";

const T = Date.parse("2026-11-03T10:00:00.000Z");

const entry = (over: Partial<Entry> = {}): Entry => ({
  id: 4,
  guildId: "g",
  userId: "u1",
  topic: "word",
  text: "Too easy\nAdd hard mode",
  channelId: "c",
  messageId: "m",
  createdAt: T,
  editedAt: null,
  removedAt: null,
  readAt: null,
  ...over,
});

const storedPoll = (over: Partial<StoredPoll> = {}): StoredPoll => ({
  id: 2,
  guildId: "g",
  channelId: "c",
  messageId: "m",
  question: "Bigger grids?",
  options: ["Yes", "No"],
  multi: false,
  createdAt: T,
  endsAt: T + 3_600_000,
  ...over,
});

test("an entry: id, topic, name, created, then the text indented", () => {
  expect(entriesText([entry()], new Map([["u1", "alice"]]))).toBe(
    "#4 [word] alice 2026-11-03T10:00:00.000Z\n    Too easy\n    Add hard mode",
  );
});

test("edited and removed marks; an unknown name stays the id", () => {
  const text = entriesText(
    [entry({ editedAt: 1 }), entry({ id: 5, editedAt: 1, removedAt: 2, text: "x" })],
    new Map(),
  );

  expect(text).toBe(
    "#4 [word] u1 2026-11-03T10:00:00.000Z (edited)\n    Too easy\n    Add hard mode\n\n" +
      "#5 [word] u1 2026-11-03T10:00:00.000Z (edited, removed)\n    x",
  );
  expect(entriesText([], new Map())).toBe("No feedback to show.");
});

test("polls: open until they end", () => {
  const polls = [storedPoll(), storedPoll({ id: 3, question: "Q", endsAt: T })];

  expect(pollsText(polls, T)).toBe(
    "#2 Bigger grids? · ends 2026-11-03T11:00:00.000Z · open\n" +
      "#3 Q · ends 2026-11-03T10:00:00.000Z · closed",
  );
  expect(pollsText([], T)).toBe("No polls.");
});

test("results: votes and voters per answer", () => {
  const tallies = [
    { text: "Yes", count: 2, voters: ["alice", "bob"] },
    { text: "No", count: 1, voters: ["carol"] },
    { text: "Maybe", count: 0, voters: [] },
  ];

  expect(resultsText(storedPoll(), { finalized: true }, tallies)).toBe(
    "poll #2: Bigger grids?\nfinalised\n1. Yes: 2 votes (alice, bob)\n2. No: 1 vote (carol)\n3. Maybe: 0 votes",
  );
  expect(resultsText(storedPoll(), { finalized: false }, [])).toBe(
    "poll #2: Bigger grids?\nnot finalised (ends 2026-11-03T11:00:00.000Z)",
  );
});
