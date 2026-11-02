import { describe, expect, test } from "bun:test";
import type { Database } from "bun:sqlite";
import { InteractionContextType } from "discord.js";
import { runMigrations } from "../../../src/core/db.ts";
import { coreMigrations } from "../../../src/core/settings.ts";
import { freshDb as sudokuDb } from "./store/fixtures.ts";
import { data } from "../../../src/modules/sudoku/commands/data.ts";
import { settings } from "../../../src/modules/sudoku/commands/settings.ts";
import type { CommandCtx } from "../../../src/modules/sudoku/commands/types.ts";
import type { SudokuRepo } from "../../../src/modules/sudoku/store/repo.ts";
import { sudokuModule } from "../../../src/modules/sudoku/index.ts";

type Opt = { name: string; required?: boolean; choices?: { name: string; value: string }[] };
type Sub = { name: string; options?: Opt[] };
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the built JSON, read through the shape the tests need
const subs = (data.options ?? []) as unknown as Sub[];
const optionsOf = (name: string): Opt[] => subs.find((s) => s.name === name)?.options ?? [];

describe("/sudoku", () => {
  test("five subcommands in a server", () => {
    expect(data.name).toBe("sudoku");
    expect(data.contexts).toEqual([InteractionContextType.Guild]);
    expect(subs.map((s) => s.name)).toEqual([
      "daily",
      "practice",
      "stats",
      "leaderboard",
      "settings",
    ]);
  });

  test("daily and practice need a difficulty", () => {
    for (const name of ["daily", "practice"]) {
      const o = optionsOf(name).find((x) => x.name === "difficulty");
      expect(o?.required).toBe(true);
      expect(o?.choices?.map((c) => c.value)).toEqual(["easy", "medium", "hard"]);
    }
  });

  test("leaderboard has the four periods", () => {
    const o = optionsOf("leaderboard").find((x) => x.name === "period");
    expect(o?.choices?.map((c) => c.value)).toEqual(["today", "week", "month", "all"]);
  });

  test("settings takes a required timezone", () => {
    const o = optionsOf("settings").find((x) => x.name === "timezone");
    expect(o?.required).toBe(true);
  });

  test("the module owns its buttons and tables", () => {
    const m = sudokuModule();
    expect(m.name).toBe("sudoku");
    expect(m.title).toBe("🔢 Sudoku");
    expect(m.commands?.map((c) => c.data.name)).toEqual(["sudoku"]);
    expect(m.components?.length).toBeGreaterThan(0);
    expect(m.migrations?.length).toBeGreaterThan(0);
  });
});

function freshDb() {
  const r = sudokuDb();
  runMigrations(r.db, coreMigrations);

  return r;
}

function fake(perms: boolean, tz = "Europe/Paris") {
  const replies: { content?: string; flags?: unknown }[] = [];
  const i = {
    memberPermissions: { has: () => perms },
    options: { getString: () => tz },
    reply: async (r: { content?: string }) => void replies.push(r),
  };

  return { i, replies };
}

function run(db: Database, repo: SudokuRepo, i: ReturnType<typeof fake>["i"]): Promise<void> {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the calls settings makes
  const stand = i as unknown as CommandCtx["i"];

  return settings({ i: stand, guildId: "g", db, repo, random: Math.random });
}

describe("/sudoku settings", () => {
  test("refuses a member without Manage Server", async () => {
    const { db, repo } = freshDb();
    const { i, replies } = fake(false);
    await run(db, repo, i);
    expect(replies[0]?.content).toContain("Manage Server");
  });

  test("saves for a manager", async () => {
    const { db, repo } = freshDb();
    const { i, replies } = fake(true);
    await run(db, repo, i);
    expect(replies[0]?.content).toBe(
      "Time zone set to Europe/Paris. Applies from the next puzzle.",
    );
  });

  test("replies with the error for a bad zone", async () => {
    const { db, repo } = freshDb();
    const { i, replies } = fake(true, "Mars/Base");
    await run(db, repo, i);
    expect(replies[0]?.content).toBe("Unknown time zone: Mars/Base.");
  });
});
