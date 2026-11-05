import { expect, test } from "bun:test";
import { TRACKS, trackOf } from "../../../src/modules/word/tracks.ts";
import { freshDb, game, multiGame, seed } from "./fixtures.ts";

test("the mode option picks the track; anything else is classic", () => {
  expect(trackOf("duo")).toBe(TRACKS.duo);
  expect(trackOf("quad").maxAttempts).toBe(9);
  expect(trackOf("classic")).toBe(TRACKS.classic);
  expect(trackOf(null)).toBe(TRACKS.classic);
});

test("each track reads only its own games", () => {
  const { repo } = freshDb();
  seed(repo, game("u", "2026-11-05"));
  repo.multiGames.finish(multiGame({ won: true, found: 2, points: 150, streak: 1, finishedAt: 2 }));
  const all = { from: "2026-11-01", to: "2026-11-30", label: "x" };
  expect(TRACKS.classic.finishedIn(repo, "g", all)).toHaveLength(1);
  expect(TRACKS.duo.finishedBy(repo, "g", "u").map((g) => g.points)).toEqual([150]);
  expect(TRACKS.quad.finishedIn(repo, "g", all)).toEqual([]);
});
