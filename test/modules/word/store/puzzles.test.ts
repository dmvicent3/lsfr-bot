import { beforeEach, expect, test } from "bun:test";
import type { WordRepo } from "../../../../src/modules/word/store/repo.ts";
import { freshDb } from "../fixtures.ts";

let repo: WordRepo;

beforeEach(() => {
  repo = freshDb().repo;
});

test("create keeps the first word for a date", () => {
  repo.puzzles.create({ guildId: "g", date: "2026-10-28", word: "crane", length: 5 });
  const again = repo.puzzles.create({ guildId: "g", date: "2026-10-28", word: "slate", length: 5 });
  expect(again.word).toBe("crane");
  expect(repo.puzzles.get("g", "2026-10-28")?.word).toBe("crane");
});

test("puzzles are per server", () => {
  repo.puzzles.create({ guildId: "g", date: "2026-10-28", word: "crane", length: 5 });
  expect(repo.puzzles.get("h", "2026-10-28")).toBeNull();
});

test("used words are the server's own", () => {
  repo.puzzles.create({ guildId: "g", date: "2026-10-28", word: "crane", length: 5 });
  repo.puzzles.create({ guildId: "h", date: "2026-10-28", word: "slate", length: 5 });
  expect(repo.puzzles.usedWords("g")).toEqual(new Set(["crane"]));
});
