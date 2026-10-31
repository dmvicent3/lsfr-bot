import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import { runMigrations } from "../../../../src/core/db.ts";
import { GameStore } from "../../../../src/modules/tictactoe/store/games.ts";
import { tictactoeMigrations } from "../../../../src/modules/tictactoe/store/migrations.ts";
import type { Game } from "../../../../src/modules/tictactoe/types.ts";
import { board } from "../fixtures.ts";

const GAME: Game = {
  guildId: "g",
  channelId: "c",
  messageId: null,
  playerId: "u",
  board: board("X---O----"),
  jevosMark: "O",
  difficulty: "normal",
  updatedAt: 1_000,
};

let db: Database;
let store: GameStore;

beforeEach(() => {
  db = new Database(":memory:", { strict: true });
  runMigrations(db, tictactoeMigrations);
  store = new GameStore(db);
});

describe("GameStore", () => {
  test("a game round-trips", () => {
    store.put(GAME);
    expect(store.get("g")).toEqual(GAME);
  });

  test("a second game for the server replaces the first", () => {
    store.put(GAME);
    store.put({ ...GAME, messageId: "m", board: board("X---O---X"), updatedAt: 2_000 });
    expect(store.get("g")).toMatchObject({ messageId: "m", updatedAt: 2_000 });
    expect(store.get("g")?.board[8]).toBe("X");
  });

  test("a game stored before difficulty existed reads as normal", () => {
    db.query(
      `INSERT INTO tictactoe_games (guild_id, channel_id, message_id, player_id, board, jevos_mark, updated_at)
       VALUES ('g', 'c', NULL, 'u', '---------', 'O', 1)`,
    ).run();
    expect(store.get("g")?.difficulty).toBe("normal");
  });

  test("the difficulty round-trips", () => {
    store.put({ ...GAME, difficulty: "hard" });
    expect(store.get("g")?.difficulty).toBe("hard");
  });

  test("a removed game is gone", () => {
    store.put(GAME);
    store.remove("g");
    expect(store.get("g")).toBeNull();
  });
});
