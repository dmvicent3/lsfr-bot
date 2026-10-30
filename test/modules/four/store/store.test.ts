import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { runMigrations } from "../../../../src/core/db.ts";
import { REPLACED, outcomeFinish } from "../../../../src/modules/four/store/finish.ts";
import { fourMigrations } from "../../../../src/modules/four/store/migrations.ts";
import { FourRepo } from "../../../../src/modules/four/store/repo.ts";
import type { Difficulty, Game } from "../../../../src/modules/four/types.ts";
import { board } from "../fixtures.ts";

function repo(): FourRepo {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, fourMigrations);

  return new FourRepo(db);
}

const game = (playerId: string, moves = 0, difficulty: Difficulty = "hard"): Game => ({
  guildId: "g",
  playerId,
  channelId: "c",
  messageId: `m-${playerId}`,
  board: board([`${"R".repeat(moves)}${".".repeat(7 - moves)}`]),
  first: "player",
  difficulty,
  startedAt: 1,
  updatedAt: 2,
});

const win = (at: number) => ({ result: "win", how: "four", endedAt: at }) as const;

test("games round-trip per player, and are found by their message", () => {
  const r = repo();
  r.games.put(game("a", 3));
  r.games.put(game("b"));
  expect(r.games.get("g", "a")).toEqual(game("a", 3));
  expect(r.games.byMessage("m-b")?.playerId).toBe("b");
  r.games.remove("g", "b");
  expect(r.games.get("g", "b")).toBeNull();
});

test("a game finishes once: the second finish records nothing", () => {
  const r = repo();
  r.games.put(game("a", 2));
  expect(r.games.finish(game("a", 2), win(5))).toBe(true);
  expect(r.games.finish(game("a", 2), win(6))).toBe(false);
  expect(r.games.get("g", "a")).toBeNull();
  expect(r.results.stats("g", "a").hard.wins).toBe(1);
});

function played(r: FourRepo, g: Game, f: Parameters<FourRepo["games"]["finish"]>[1]): void {
  r.games.put(g);
  r.games.finish(g, f);
}

test("stats per difficulty with the fewest-move win", () => {
  const r = repo();
  played(r, game("a", 5, "hard"), win(1));
  played(r, game("a", 4, "hard"), win(2));
  played(r, game("a", 6, "normal"), REPLACED(3));
  expect(r.results.stats("g", "a")).toEqual({
    easy: { wins: 0, losses: 0, draws: 0, best: null },
    normal: { wins: 0, losses: 1, draws: 0, best: null },
    hard: { wins: 2, losses: 0, draws: 0, best: 4 },
  });
});

test("points: hard 3, normal 2, easy 1; ties go to fewer moves; range respected", () => {
  const r = repo();
  played(r, game("a", 6, "hard"), win(10));
  played(r, game("b", 2, "normal"), win(10));
  played(r, game("b", 2, "easy"), win(11));
  played(r, game("c", 2, "hard"), win(99));
  expect(r.results.standings("g", 0, 50)).toEqual([
    { userId: "b", points: 3, wins: 2 },
    { userId: "a", points: 3, wins: 1 },
  ]);
});

test("outcomes map to results", () => {
  expect(outcomeFinish({ kind: "playing" }, 1)).toBeNull();
  expect(outcomeFinish({ kind: "win", winner: "player", line: [] }, 1)).toEqual(win(1));
  expect(outcomeFinish({ kind: "win", winner: "jevos", line: [] }, 1)).toEqual({
    result: "loss",
    how: "four",
    endedAt: 1,
  });
  expect(outcomeFinish({ kind: "draw" }, 1)).toEqual({ result: "draw", how: "full", endedAt: 1 });
  expect(outcomeFinish({ kind: "resigned" }, 1)?.how).toBe("resigned");
  expect(outcomeFinish({ kind: "abandoned" }, 1)).toEqual({
    result: "loss",
    how: "abandoned",
    endedAt: 1,
  });
  expect(REPLACED(4)).toEqual({ result: "loss", how: "replaced", endedAt: 4 });
});
