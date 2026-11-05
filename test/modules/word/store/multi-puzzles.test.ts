import { beforeEach, expect, test } from "bun:test";
import type { WordRepo } from "../../../../src/modules/word/store/repo.ts";
import { freshDb } from "../fixtures.ts";

let repo: WordRepo;

beforeEach(() => {
  repo = freshDb().repo;
});

const DUO = {
  guildId: "g",
  mode: "duo" as const,
  date: "2026-11-05",
  words: ["crane", "slate"],
  length: 5,
};

test("the first puzzle of a mode and date stays", () => {
  expect(repo.multiPuzzles.create(DUO)).toEqual(DUO);
  expect(repo.multiPuzzles.create({ ...DUO, words: ["bumpy", "fjord"] })).toEqual(DUO);
  expect(repo.multiPuzzles.get("g", "quad", "2026-11-05")).toBeNull();
});

test("used words span every mode and date of the server", () => {
  repo.multiPuzzles.create(DUO);
  repo.multiPuzzles.create({ ...DUO, mode: "quad", words: ["a", "b", "c", "d"] });
  repo.multiPuzzles.create({ ...DUO, guildId: "h", words: ["x", "y"] });
  expect(repo.multiPuzzles.usedWords("g")).toEqual(new Set(["crane", "slate", "a", "b", "c", "d"]));
});
