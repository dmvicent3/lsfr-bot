import { expect, test } from "bun:test";
import { TRACKS } from "../../../src/modules/word/tracks.ts";
import { freshDb, game, multiGame, seed } from "./fixtures.ts";

test("each track points at its own command and page buttons", () => {
  expect([TRACKS.classic.play, TRACKS.duo.play, TRACKS.quad.play]).toEqual([
    "/word guess",
    "/duo play",
    "/quad play",
  ]);
  expect(TRACKS.duo.pagePrefix).toBe("word:duopage");
  expect(TRACKS.quad.maxAttempts).toBe(9);
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
