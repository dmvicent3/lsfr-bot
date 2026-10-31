import { expect, test } from "bun:test";
import type { FleetRepo } from "../../../../src/modules/fleet/store/repo.ts";
import type { Finish } from "../../../../src/modules/fleet/store/types.ts";
import type { Difficulty } from "../../../../src/modules/fleet/types.ts";
import { repo, shotGame } from "./repo.ts";

interface Row {
  player: string;
  shots: number;
  hits: number;
  difficulty: Difficulty;
  finish: Finish;
}

const win = (endedAt: number): Finish => ({ result: "win", how: "sunk", endedAt });

function add(r: FleetRepo, rows: Row[]): void {
  for (const row of rows) {
    const g = shotGame(row.player, row);
    r.games.put(g);
    r.games.finish(g, row.finish);
  }
}

test("stats", () => {
  const { repo: r } = repo();
  add(r, [
    { player: "a", shots: 30, hits: 17, difficulty: "easy", finish: win(1) },
    { player: "a", shots: 45, hits: 17, difficulty: "hard", finish: win(2) },
    {
      player: "a",
      shots: 10,
      hits: 3,
      difficulty: "normal",
      finish: { result: "loss", how: "resigned", endedAt: 3 },
    },
    {
      player: "a",
      shots: 5,
      hits: 1,
      difficulty: "normal",
      finish: { result: "loss", how: "abandoned", endedAt: 4 },
    },
  ]);
  expect(r.results.stats("g", "a")).toEqual({
    levels: {
      easy: { wins: 1, losses: 0, best: 30 },
      normal: { wins: 0, losses: 2, best: null },
      hard: { wins: 1, losses: 0, best: 45 },
    },
    shots: 90,
    hits: 38,
    resigned: 1,
    abandoned: 1,
  });
});

test("standings weigh hard 3, normal 2, easy 1; ties by fewer shots", () => {
  const { repo: r } = repo();
  add(r, [
    { player: "a", shots: 40, hits: 17, difficulty: "hard", finish: win(10) },
    { player: "b", shots: 30, hits: 17, difficulty: "normal", finish: win(11) },
    { player: "b", shots: 30, hits: 17, difficulty: "easy", finish: win(12) },
    { player: "c", shots: 50, hits: 17, difficulty: "hard", finish: win(13) },
    { player: "d", shots: 20, hits: 17, difficulty: "hard", finish: win(99) },
  ]);
  expect(r.results.standings("g", 0, 50)).toEqual([
    { userId: "a", points: 3, wins: 1 },
    { userId: "c", points: 3, wins: 1 },
    { userId: "b", points: 3, wins: 2 },
  ]);
});
