import { describe, expect, test } from "bun:test";
import { MessageFlags } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import { runMigrations } from "../../../../src/core/db.ts";
import { coreMigrations } from "../../../../src/core/settings.ts";
import { dateIn } from "../../../../src/core/zoned.ts";
import { snakeCommand } from "../../../../src/modules/snake/commands/commands.ts";
import { data } from "../../../../src/modules/snake/commands/data.ts";
import { play } from "../../../../src/modules/snake/commands/play.ts";
import { practice } from "../../../../src/modules/snake/commands/practice.ts";
import type { CommandCtx } from "../../../../src/modules/snake/commands/types.ts";
import { snakeModule } from "../../../../src/modules/snake/index.ts";
import { loadAnswers } from "../../../../src/modules/snake/words/load.ts";
import { seeded } from "../../shed/testing/random.ts";
import { viewText } from "../../crossword/view-text.ts";
import { freshDb, practice as practiceRound } from "../store/fixtures.ts";

type Sub = { name: string };
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the built JSON, read through the shape the tests need
const subs = (data.options ?? []) as unknown as Sub[];

function db() {
  const r = freshDb();
  runMigrations(r.db, coreMigrations);

  return r;
}

type Sent = { flags?: unknown; components?: unknown[]; content?: string; files?: unknown[] };

function fake() {
  const sent: Sent[] = [];
  const i = { user: { id: "u" }, reply: async (m: Sent) => void sent.push(m) };

  return { i, sent };
}

function ctx(i: object, r = db()): CommandCtx {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the calls the handlers make
  const stand = i as unknown as CommandCtx["i"];

  return { i: stand, guildId: "g", db: r.db, repo: r.repo, random: seeded(7) };
}

const PRIVATE = [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2];

describe("/snake data and module", () => {
  test("five subcommands", () => {
    expect(data.name).toBe("snake");
    expect(subs.map((s) => s.name)).toEqual([
      "play",
      "practice",
      "stats",
      "leaderboard",
      "settings",
    ]);
  });

  test("the module owns its command, buttons, modal and tables", () => {
    const m = snakeModule();
    expect(m.title).toBe("🐍 Snake");
    expect(m.helpNote).toContain("ENABLE");
    expect(m.commands?.map((c) => c.data.name)).toEqual(["snake"]);
    expect(m.modals?.map((h) => h.id)).toEqual(["snake:answer"]);
    expect(m.migrations?.length).toBeGreaterThan(0);
  });
});

describe("/snake play", () => {
  test("picks today's word and opens a private, empty board", async () => {
    const r = db();
    const { i, sent } = fake();
    await play(ctx(i, r));

    const date = dateIn(Date.now(), "Europe/Lisbon");
    expect(sent[0]?.flags).toEqual(PRIVATE);
    expect(viewText(sent[0])).toContain("**Snake #");
    expect(viewText(sent[0])).toContain("Find the hidden word");
    expect(sent[0]?.files).toBeUndefined();
    expect(loadAnswers()).toContain(r.repo.puzzles.get("g", date) ?? "");
    expect(r.repo.games.get("g", date, "u")?.guesses).toEqual([]);
  });

  test("a second open keeps the same word", async () => {
    const r = db();
    await play(ctx(fake().i, r));
    const date = dateIn(Date.now(), "Europe/Lisbon");
    const first = r.repo.puzzles.get("g", date);
    await play(ctx(fake().i, r));
    expect(r.repo.puzzles.get("g", date)).toBe(first);
  });
});

describe("/snake practice", () => {
  test("opens a new private round", async () => {
    const r = db();
    const { i, sent } = fake();
    await practice(ctx(i, r));
    expect(sent[0]?.flags).toEqual(PRIVATE);
    expect(viewText(sent[0])).toContain("Practice snake");
    expect(loadAnswers()).toContain(r.repo.practice.get("g", "u")?.answer ?? "");
  });

  test("resumes the kept round", async () => {
    const r = db();
    r.repo.practice.replace(practiceRound({ startedAt: 5 }));
    await practice(ctx(fake().i, r));
    expect(r.repo.practice.get("g", "u")?.startedAt).toBe(5);
  });
});

test("outside a server it says so", async () => {
  const replies: { content?: string }[] = [];
  const i = {
    guildId: null,
    options: { getSubcommand: () => "play" },
    reply: async (m: { content?: string }) => void replies.push(m),
  };
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- stand-ins for the calls execute makes
  const stand = i as unknown as ChatInputCommandInteraction;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- execute only reads the db
  const rt = { db: db().db } as unknown as Parameters<
    ReturnType<typeof snakeCommand>["execute"]
  >[1];
  await snakeCommand(Math.random).execute(stand, rt);
  expect(replies[0]?.content).toBe("Snake works in a server.");
});
