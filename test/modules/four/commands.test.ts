import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { runMigrations } from "../../../src/core/db.ts";
import type { Jev } from "../../../src/core/jev/types.ts";
import { clickVerdict } from "../../../src/modules/four/click.ts";
import { data } from "../../../src/modules/four/commands/data.ts";
import { replaceOld } from "../../../src/modules/four/commands/replace.ts";
import { ABANDON_MS } from "../../../src/modules/four/game.ts";
import { fourModule } from "../../../src/modules/four/index.ts";
import { fourMigrations } from "../../../src/modules/four/store/migrations.ts";
import { FourRepo } from "../../../src/modules/four/store/repo.ts";
import {
  isThinking,
  startThinking,
  stopThinking,
  thinkKey,
} from "../../../src/modules/four/thinking.ts";
import type { Game } from "../../../src/modules/four/types.ts";
import { board } from "./fixtures.ts";

const JEV: Jev = { yesNo: async () => new Map() };

const game = (rows: string[]): Game => ({
  guildId: "g",
  playerId: "u",
  channelId: "c",
  messageId: "m",
  board: board(rows),
  first: "player",
  difficulty: "easy",
  startedAt: 0,
  updatedAt: 0,
});

function repo(): FourRepo {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, fourMigrations);

  return new FourRepo(db);
}

describe("/four", () => {
  test("three subcommands; play takes a difficulty", () => {
    expect(data.name).toBe("four");
    const subs = (data.options ?? []).map((o) => o.name);
    expect(subs).toEqual(["play", "stats", "leaderboard"]);
    expect(JSON.stringify(data.options?.[0])).toContain(
      '"choices":[{"name":"Easy","value":"easy"}',
    );
  });

  test("the module routes its buttons and owns its tables", () => {
    const m = fourModule(JEV);
    expect(m.components?.map((c) => c.id)).toEqual(["four:drop", "four:resign", "four:page"]);
    expect(m.commands?.map((c) => c.data.name)).toEqual(["four"]);
    expect(m.migrations?.map((x) => x.id)).toEqual(["four-001-init"]);
  });
});

test("only the player may click, and only a live board", () => {
  expect(clickVerdict(null, { userId: "u" })).toBe("over");
  expect(clickVerdict(game([]), { userId: "x" })).toBe("not-yours");
  expect(clickVerdict(game([]), { userId: "u" })).toBe("play");
});

test("the thinking lock is per player", () => {
  const key = thinkKey("g", "u");
  expect(startThinking(key)).toBe(true);
  expect(startThinking(key)).toBe(false);
  expect(startThinking(thinkKey("g", "v"))).toBe(true);
  expect(isThinking(key)).toBe(true);
  stopThinking(key);
  stopThinking(thinkKey("g", "v"));
  expect(isThinking(key)).toBe(false);
});

describe("a new game replaces the old one", () => {
  test("no disc dropped yet: gone, nothing recorded", () => {
    const r = repo();
    r.games.put(game([]));
    expect(replaceOld(r, game([]), 1)).toBe("removed");
    expect(r.games.get("g", "u")).toBeNull();
    expect(r.results.stats("g", "u").easy.losses).toBe(0);
  });

  test("after a drop: a loss, replaced", () => {
    const r = repo();
    r.games.put(game(["RY....."]));
    expect(replaceOld(r, game(["RY....."]), 1)).toBe("replaced");
    expect(r.results.stats("g", "u").easy.losses).toBe(1);
  });

  test("idle 10 minutes after a drop: a loss, abandoned", () => {
    const r = repo();
    r.games.put(game(["RY....."]));
    expect(replaceOld(r, game(["RY....."]), ABANDON_MS)).toBe("abandoned");
    expect(r.results.stats("g", "u").easy.losses).toBe(1);
  });

  test("idle with no drop: gone, nothing recorded", () => {
    const r = repo();
    r.games.put(game([]));
    expect(replaceOld(r, game([]), ABANDON_MS)).toBe("removed");
    expect(r.results.stats("g", "u").easy.losses).toBe(0);
  });

  test("left waiting on jevos by a restart: gone, nothing recorded", () => {
    const r = repo();
    r.games.put(game(["RYR...."]));
    expect(replaceOld(r, game(["RYR...."]), 1)).toBe("removed");
    expect(r.results.stats("g", "u").easy.losses).toBe(0);
  });
});
