import { expect, test } from "bun:test";
import { playing, rowsFleet } from "../fixtures.ts";
import { repo, shotGame } from "./repo.ts";

const loss = { result: "loss", how: "resigned", endedAt: 9 } as const;

test("state survives a round trip", () => {
  const { repo: r } = repo();
  const g = playing({
    cursor: 57,
    dir: "down",
    first: "jevos",
    player: { ships: rowsFleet(), shots: [3, 14] },
    jevos: { ships: rowsFleet().slice(0, 4), shots: [99] },
  });
  r.games.put(g);
  expect(r.games.get("g", "u")).toEqual(g);
  expect(r.games.byMessage("m")).toEqual(g);
});

test("an unreadable row is no game", () => {
  const { db, repo: r } = repo();
  db.query(
    `INSERT INTO fleet_games (guild_id, player_id, channel_id, message_id, difficulty, state,
       started_at, updated_at) VALUES ('g', 'u', 'c', 'm', 'easy', '{', 1, 1)`,
  ).run();
  expect(r.games.get("g", "u")).toBeNull();
  expect(r.games.byMessage("m")).toBeNull();
});

test("finish records once, and never without a player shot", () => {
  const { db, repo: r } = repo();
  const g = shotGame("a", { shots: 4, hits: 1, difficulty: "easy" });
  r.games.put(g);
  expect(r.games.finish(g, loss)).toBe(true);
  expect(r.games.finish(g, loss)).toBe(false);
  const idle = playing({ playerId: "b" });
  r.games.put(idle);
  expect(r.games.finish(idle, loss)).toBe(true);
  expect(r.games.get("g", "b")).toBeNull();
  const rows = db.query<{ player_id: string; shots: number; hits: number }, []>(
    "SELECT player_id, shots, hits FROM fleet_results",
  );
  expect(rows.all()).toEqual([{ player_id: "a", shots: 4, hits: 1 }]);
});
