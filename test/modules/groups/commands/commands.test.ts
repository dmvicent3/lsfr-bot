import { describe, expect, test } from "bun:test";
import { MessageFlags } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import { runMigrations } from "../../../../src/core/db.ts";
import { coreMigrations } from "../../../../src/core/settings.ts";
import { dateIn } from "../../../../src/core/zoned.ts";
import { groupsCommand } from "../../../../src/modules/groups/commands/commands.ts";
import { data } from "../../../../src/modules/groups/commands/data.ts";
import { play } from "../../../../src/modules/groups/commands/play.ts";
import { practice } from "../../../../src/modules/groups/commands/practice.ts";
import type { CommandCtx } from "../../../../src/modules/groups/commands/types.ts";
import { groupsModule } from "../../../../src/modules/groups/index.ts";
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

type Sent = { flags?: unknown; components?: unknown[]; content?: string };

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

describe("/groups data and module", () => {
  test("five subcommands", () => {
    expect(data.name).toBe("groups");
    expect(subs.map((s) => s.name)).toEqual([
      "play",
      "practice",
      "stats",
      "leaderboard",
      "settings",
    ]);
  });

  test("the module owns its command, buttons and tables", () => {
    const m = groupsModule();
    expect(m.title).toBe("🧩 Groups");
    expect(m.helpNote).toContain("WordNet");
    expect(m.commands?.map((c) => c.data.name)).toEqual(["groups"]);
    expect(m.migrations?.length).toBeGreaterThan(0);
  });
});

describe("/groups play", () => {
  test("builds today's puzzle from the bank and opens a private board", async () => {
    const r = db();
    const { i, sent } = fake();
    await play(ctx(i, r));

    const date = dateIn(Date.now(), "Europe/Lisbon");
    expect(sent[0]?.flags).toEqual(PRIVATE);
    expect(viewText(sent[0])).toContain("**Groups #");
    expect(r.repo.puzzles.get("g", date)?.groups).toHaveLength(4);
    expect(r.repo.games.get("g", date, "u")?.order).toHaveLength(16);
  });

  test("a second open keeps the same puzzle and game", async () => {
    const r = db();
    await play(ctx(fake().i, r));
    const date = dateIn(Date.now(), "Europe/Lisbon");
    const first = r.repo.puzzles.get("g", date);
    await play(ctx(fake().i, r));
    expect(r.repo.puzzles.get("g", date)).toEqual(first);
  });
});

describe("/groups practice", () => {
  test("opens a new private round", async () => {
    const r = db();
    const { i, sent } = fake();
    await practice(ctx(i, r));
    expect(sent[0]?.flags).toEqual(PRIVATE);
    expect(viewText(sent[0])).toContain("Practice groups");
    expect(r.repo.practice.get("g", "u")?.puzzle.groups).toHaveLength(4);
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
    ReturnType<typeof groupsCommand>["execute"]
  >[1];
  await groupsCommand(Math.random).execute(stand, rt);
  expect(replies[0]?.content).toBe("Groups works in a server.");
});
