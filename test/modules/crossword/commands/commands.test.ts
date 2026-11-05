import { describe, expect, test } from "bun:test";
import { InteractionContextType, MessageFlags } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import { runMigrations } from "../../../../src/core/db.ts";
import { coreMigrations } from "../../../../src/core/settings.ts";
import { dateIn } from "../../../../src/core/zoned.ts";
import { crosswordCommand } from "../../../../src/modules/crossword/commands/commands.ts";
import { data } from "../../../../src/modules/crossword/commands/data.ts";
import { leaderboard } from "../../../../src/modules/crossword/commands/leaderboard.ts";
import { play } from "../../../../src/modules/crossword/commands/play.ts";
import { practice } from "../../../../src/modules/crossword/commands/practice.ts";
import { settings } from "../../../../src/modules/crossword/commands/settings.ts";
import { stats } from "../../../../src/modules/crossword/commands/stats.ts";
import type { CommandCtx } from "../../../../src/modules/crossword/commands/types.ts";
import { crosswordComponents } from "../../../../src/modules/crossword/components/components.ts";
import { crosswordModule } from "../../../../src/modules/crossword/index.ts";
import { seeded } from "../../shed/testing/random.ts";
import { storedSquare } from "../play/fixtures.ts";
import { viewText } from "../view-text.ts";
import { freshDb, game, practice as practiceRound, puzzle } from "../store/fixtures.ts";

type Opt = {
  name: string;
  required?: boolean;
  max_length?: number;
  choices?: { value: unknown }[];
};
type Sub = { name: string; options?: Opt[] };
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the built JSON, read through the shape the tests need
const subs = (data.options ?? []) as unknown as Sub[];
const optionsOf = (name: string): Opt[] => subs.find((s) => s.name === name)?.options ?? [];

describe("/crossword data and module", () => {
  test("five subcommands in a server", () => {
    expect(data.name).toBe("crossword");
    expect(data.contexts).toEqual([InteractionContextType.Guild]);
    expect(subs.map((s) => s.name)).toEqual([
      "play",
      "practice",
      "stats",
      "leaderboard",
      "settings",
    ]);
  });

  test("practice takes an optional size of 5, 7 or 15", () => {
    const o = optionsOf("practice");
    expect(o.map((x) => x.name)).toEqual(["size"]);
    expect(o[0]?.required).toBeFalsy();
    expect(o[0]?.choices?.map((c) => c.value)).toEqual([5, 7, 15]);
  });

  test("leaderboard has the four periods, stats an optional user, settings a timezone", () => {
    const p = optionsOf("leaderboard").find((x) => x.name === "period");
    expect(p?.choices?.map((c) => c.value)).toEqual(["today", "week", "month", "all"]);
    expect(optionsOf("stats").map((x) => x.name)).toEqual(["user"]);
    const tz = optionsOf("settings").find((x) => x.name === "timezone");
    expect(tz?.required).toBe(true);
    expect(tz?.max_length).toBe(64);
  });

  test("the module owns its command, buttons, modal and tables", () => {
    const m = crosswordModule();
    expect(m.name).toBe("crossword");
    expect(m.title).toBe("📰 Crossword");
    expect(m.helpNote).toBe(
      "A daily 5×5 mini crossword, the same for everyone in the server; answers are private. Words: ENABLE (public domain) and FrequencyWords; definitions: Princeton WordNet 3.1 (WordNet licence); clues written by the local model. Grid font: DejaVu Sans.",
    );
    expect(m.commands?.map((c) => c.data.name)).toEqual(["crossword"]);
    expect(m.modals?.length).toBeGreaterThan(0);
    expect(m.migrations?.length).toBeGreaterThan(0);
  });

  test("the leaderboard pages have a handler", () => {
    expect(crosswordComponents(null, Math.random).map((h) => h.id)).toContain("crossword:page");
  });
});

function db() {
  const r = freshDb();
  runMigrations(r.db, coreMigrations);

  return r;
}

function ctx(i: object, r = db()): CommandCtx {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the calls the handlers make
  const stand = i as unknown as CommandCtx["i"];

  return { i: stand, guildId: "g", db: r.db, repo: r.repo, ask: null, random: seeded(7) };
}

function playFake(size: number | null = null) {
  const order: string[] = [];
  type Edit = { flags?: unknown; components?: unknown[]; files?: { name?: string }[] };
  const sent: { flags?: unknown; edited?: Edit | string } = {};
  const i = {
    user: { id: "u" },
    options: { getInteger: () => size },
    deferReply: async (o: { flags?: unknown }) => {
      order.push("deferReply");
      sent.flags = o.flags;
    },
    editReply: async (m: Edit | string) => {
      order.push("editReply");
      sent.edited = m;
    },
  };

  return { i, order, sent };
}

const bigRound = () =>
  practiceRound({ puzzle: { ...puzzle(), size: 7 }, cells: ".".repeat(49), startedAt: 5 });

describe("/crossword play", () => {
  test("defers privately, then edits in the board", async () => {
    const r = db();
    const date = dateIn(Date.now(), "Europe/Lisbon");
    r.repo.puzzles.create("g", date, storedSquare());
    const { i, order, sent } = playFake();
    await play(ctx(i, r));
    expect(order).toEqual(["deferReply", "editReply"]);
    expect(sent.flags).toBe(MessageFlags.Ephemeral);
    const edited = typeof sent.edited === "object" ? sent.edited : {};
    expect(edited.flags).toBe(MessageFlags.IsComponentsV2);
    expect("content" in edited).toBe(false);
    expect(viewText(edited)).toContain("Crossword #");
    expect(edited.components?.length).toBeGreaterThan(0);
    expect(edited.files?.map((f) => f.name)).toEqual(["crossword.png"]);
    expect(r.repo.games.get("g", date, "u")).not.toBeNull();
  });

  test("builds the day puzzle on the first open", async () => {
    const r = db();
    const { i, order } = playFake();
    await play(ctx(i, r));
    expect(order).toEqual(["deferReply", "editReply"]);
    expect(r.repo.puzzles.get("g", dateIn(Date.now(), "Europe/Lisbon"))).not.toBeNull();
  });
});

describe("/crossword practice", () => {
  test("defers privately, opens a 5x5 and keeps it", async () => {
    const r = db();
    const { i, order, sent } = playFake();
    await practice(ctx(i, r));
    expect(order).toEqual(["deferReply", "editReply"]);
    expect(sent.flags).toBe(MessageFlags.Ephemeral);
    expect(r.repo.practice.get("g", "u")?.puzzle.size).toBe(5);
  });

  test("resumes the kept puzzle when no size is given, whatever its size", async () => {
    const r = db();
    r.repo.practice.replace(bigRound());
    await practice(ctx(playFake().i, r));
    expect(r.repo.practice.get("g", "u")?.startedAt).toBe(5);
  });

  test("resumes when the given size matches", async () => {
    const r = db();
    r.repo.practice.replace(bigRound());
    await practice(ctx(playFake(7).i, r));
    expect(r.repo.practice.get("g", "u")?.startedAt).toBe(5);
  });

  test("a different size starts a new puzzle", async () => {
    const r = db();
    r.repo.practice.replace(bigRound());
    await practice(ctx(playFake(5).i, r));
    const now = r.repo.practice.get("g", "u");
    expect(now?.puzzle.size).toBe(5);
    expect(now?.startedAt).not.toBe(5);
  });
});

describe("/crossword routing and the other subcommands", () => {
  test("outside a server it says so", async () => {
    const replies: { content?: string }[] = [];
    const i = {
      guildId: null,
      options: { getSubcommand: () => "play" },
      reply: async (r: { content?: string }) => void replies.push(r),
    };
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- stand-ins for the calls execute makes
    const stand = i as unknown as ChatInputCommandInteraction;
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- execute only reads the db
    const rt = { db: db().db } as unknown as Parameters<
      ReturnType<typeof crosswordCommand>["execute"]
    >[1];
    await crosswordCommand(null, Math.random).execute(stand, rt);
    expect(replies[0]?.content).toBe("Crossword works in a server.");
  });

  test("settings refuses a member without Manage Server", async () => {
    const replies: { content?: string }[] = [];
    const i = {
      memberPermissions: { has: () => false },
      options: { getString: () => "Europe/Paris" },
      reply: async (r: { content?: string }) => void replies.push(r),
    };
    await settings(ctx(i));
    expect(replies[0]?.content).toContain("Manage Server");
  });

  test("leaderboard replies publicly with a page that pings no one", async () => {
    const replies: { content?: string; allowedMentions?: unknown }[] = [];
    const i = {
      user: { id: "u" },
      options: { getString: () => null, getInteger: () => null },
      reply: async (r: { content?: string }) => void replies.push(r),
    };
    await leaderboard(ctx(i));
    expect(replies[0]?.content).toContain("No crosswords finished yet");
    expect(replies[0]?.allowedMentions).toEqual({ parse: [] });
  });

  test("stats replies privately with the askers numbers", async () => {
    const r = db();
    const date = dateIn(Date.now(), "Europe/Lisbon");
    r.repo.games.start(
      game({ date, solved: true, points: 90, streak: 1, wrong: 2, finishedAt: 9 }),
    );
    const replies: { content?: string; flags?: unknown }[] = [];
    const i = {
      user: { id: "u", displayName: "Una" },
      options: { getUser: () => null },
      reply: async (m: { content?: string }) => void replies.push(m),
    };
    await stats(ctx(i, r));
    expect(replies[0]?.flags).toBe(MessageFlags.Ephemeral);
    expect(replies[0]?.content).toContain("Una");
    expect(replies[0]?.content).toContain("**90 points**");
  });
});
