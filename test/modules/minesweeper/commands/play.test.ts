import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import type { ChatInputCommandInteraction, Client } from "discord.js";
import { runMigrations } from "../../../../src/core/db.ts";
import type { Ctx } from "../../../../src/core/types.ts";
import { play } from "../../../../src/modules/minesweeper/commands/play.ts";
import type { CommandCtx } from "../../../../src/modules/minesweeper/commands/types.ts";
import { GameStore } from "../../../../src/modules/minesweeper/store/games.ts";
import { minesweeperMigrations } from "../../../../src/modules/minesweeper/store/migrations.ts";

let db: Database;
let posted = 0;

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

/** A /minesweeper play with no options whose replies resolve on the next tick, as Discord's do. */
function playCtx(): CommandCtx {
  const i = {
    options: { getString: () => null, getInteger: () => null },
    user: { id: "u", displayName: "Dani" },
    channelId: "c",
    deferReply: tick,
    editReply: async () => {
      await tick();
      posted += 1;

      return { id: `m${posted}` };
    },
  };
  const client = { channels: { fetch: async () => null } };

  return {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the calls play makes
    i: i as unknown as ChatInputCommandInteraction,
    guildId: "g",
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- only db and client are used
    ctx: { db, client: client as unknown as Client } as unknown as Ctx,
    store: new GameStore(db),
  };
}

const liveCount = () =>
  db
    .query<{ n: number }, []>(
      "SELECT COUNT(*) AS n FROM minesweeper_games WHERE finished_at IS NULL",
    )
    .get()?.n;

beforeEach(() => {
  db = new Database(":memory:", { strict: true });
  runMigrations(db, minesweeperMigrations);
});

describe("play", () => {
  test("posts a board and stores it as the player's live game", async () => {
    await play(playCtx());
    expect(new GameStore(db).live("g", "u")?.messageId).toBe(`m${posted}`);
  });

  test("two plays at once leave one live game", async () => {
    await Promise.all([play(playCtx()), play(playCtx())]);
    expect(liveCount()).toBe(1);
  });
});
