import { describe, expect, test } from "bun:test";
import { MessageFlags } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import { runMigrations } from "../../../../src/core/db.ts";
import { coreMigrations } from "../../../../src/core/settings.ts";
import { dateIn } from "../../../../src/core/zoned.ts";
import { snakeCommand } from "../../../../src/modules/snake/commands/commands.ts";
import { data } from "../../../../src/modules/snake/commands/data.ts";
import { NO_PRACTICE, guess } from "../../../../src/modules/snake/commands/guess.ts";
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

function fake(word = "", practiceOpt: boolean | null = null) {
  const sent: Sent[] = [];
  const posted: string[] = [];
  const i = {
    user: { id: "u" },
    reply: async (m: Sent) => void sent.push(m),
    options: { getString: () => word, getBoolean: () => practiceOpt },
    channel: { send: async (m: { content: string }) => void posted.push(m.content) },
  };

  return { i, sent, posted };
}

function ctx(i: object, r = db()): CommandCtx {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the calls the handlers make
  const stand = i as unknown as CommandCtx["i"];

  return { i: stand, guildId: "g", db: r.db, repo: r.repo, random: seeded(7) };
}

const PRIVATE = [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2];

describe("/snake data and module", () => {
  test("six subcommands", () => {
    expect(data.name).toBe("snake");
    expect(subs.map((s) => s.name)).toEqual([
      "play",
      "guess",
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

const today = (): string => dateIn(Date.now(), "Europe/Lisbon");

describe("/snake guess", () => {
  test("plays a word on today's snake, privately", async () => {
    const r = db();
    await play(ctx(fake().i, r));
    const word = r.repo.puzzles.get("g", today()) === "garden" ? "permit" : "garden";
    const { i, sent, posted } = fake(word);
    await guess(ctx(i, r));

    expect(r.repo.games.get("g", today(), "u")?.guesses).toEqual([word]);
    expect(sent[0]?.flags).toEqual(PRIVATE);
    expect(viewText(sent[0])).toContain("· 1 guess");
    expect(posted).toHaveLength(0);
  });

  test("opens today's snake when the first move is a guess", async () => {
    const r = db();
    const { i, sent } = fake("garden");
    await guess(ctx(i, r));

    expect(r.repo.puzzles.get("g", today())).toBeTruthy();
    expect(viewText(sent[0])).toContain("**Snake #");
  });

  test("a refused word is told privately and not counted", async () => {
    const r = db();
    const { i, sent } = fake("qzxv");
    await guess(ctx(i, r));

    expect(sent[0]?.content).toBe("That's not in the word list. Not counted.");
    expect(r.repo.games.get("g", today(), "u")?.guesses).toEqual([]);
  });

  test("the answer solves the daily and announces it without the word", async () => {
    const r = db();
    await play(ctx(fake().i, r));
    const answer = r.repo.puzzles.get("g", today())!;
    const { i, posted } = fake(answer);
    await guess(ctx(i, r));

    expect(r.repo.games.get("g", today(), "u")).toMatchObject({ solved: true, points: 100 });
    expect(posted[0]).toStartWith("<@u> solved Snake #");
    expect(posted[0]).not.toMatch(new RegExp(answer, "i"));
  });

  test("practice:True plays the kept practice round, with no announce", async () => {
    const r = db();
    r.repo.practice.replace(practiceRound({ startedAt: 5 }));
    const { i, sent, posted } = fake("example", true);
    await guess(ctx(i, r));

    expect(r.repo.practice.get("g", "u")?.finishedAt).not.toBeNull();
    expect(viewText(sent[0])).toContain("Practice snake");
    expect(posted).toHaveLength(0);
  });

  test("practice:True without a practice round says how to start one", async () => {
    const { i, sent } = fake("example", true);
    await guess(ctx(i));

    expect(sent[0]?.content).toBe(NO_PRACTICE);
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
