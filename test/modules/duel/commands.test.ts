import { describe, expect, spyOn, test } from "bun:test";
import { InteractionContextType, MessageFlags } from "discord.js";
import { runMigrations } from "../../../src/core/db.ts";
import { log } from "../../../src/core/log.ts";
import { coreMigrations } from "../../../src/core/settings.ts";
import { dateIn } from "../../../src/core/zoned.ts";
import { duelCommand } from "../../../src/modules/duel/commands/commands.ts";
import { data } from "../../../src/modules/duel/commands/data.ts";
import { leaderboard } from "../../../src/modules/duel/commands/leaderboard.ts";
import { play } from "../../../src/modules/duel/commands/play.ts";
import { settings } from "../../../src/modules/duel/commands/settings.ts";
import { stats } from "../../../src/modules/duel/commands/stats.ts";
import type { CommandCtx } from "../../../src/modules/duel/commands/types.ts";
import { duelModule } from "../../../src/modules/duel/index.ts";
import type { Snapshot } from "../../../src/modules/duel/types.ts";
import { fixtureSnapshot } from "./fixtures.ts";
import { freshDb, game, puzzle } from "./store/fixtures.ts";

type Opt = { name: string; required?: boolean; max_length?: number; choices?: { value: string }[] };
type Sub = { name: string; options?: Opt[] };
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the built JSON, read through the shape the tests need
const subs = (data.options ?? []) as unknown as Sub[];
const optionsOf = (name: string): Opt[] => subs.find((s) => s.name === name)?.options ?? [];

describe("/duel data", () => {
  test("four subcommands in a server", () => {
    expect(data.name).toBe("duel");
    expect(data.contexts).toEqual([InteractionContextType.Guild]);
    expect(subs.map((s) => s.name)).toEqual(["play", "stats", "leaderboard", "settings"]);
  });

  test("leaderboard has the four periods", () => {
    const o = optionsOf("leaderboard").find((x) => x.name === "period");
    expect(o?.choices?.map((c) => c.value)).toEqual(["today", "week", "month", "all"]);
  });

  test("settings takes a required timezone of at most 64 characters", () => {
    const o = optionsOf("settings").find((x) => x.name === "timezone");
    expect(o?.required).toBe(true);
    expect(o?.max_length).toBe(64);
  });

  test("the module owns its buttons and tables", () => {
    const m = duelModule();
    expect(m.name).toBe("duel");
    expect(m.title).toBe("📊 Stat duel");
    expect(m.helpNote).toContain("World Bank Open Data (CC BY 4.0) and Wikidata (CC0)");
    expect(m.commands?.map((c) => c.data.name)).toEqual(["duel"]);
    expect(m.components?.length).toBeGreaterThan(0);
    expect(m.migrations?.length).toBeGreaterThan(0);
  });
});

function db() {
  const r = freshDb();
  runMigrations(r.db, coreMigrations);

  return r;
}

function settingsFake(perms: boolean, tz = "Europe/Paris") {
  const replies: { content?: string }[] = [];
  const i = {
    memberPermissions: { has: () => perms },
    options: { getString: () => tz },
    reply: async (r: { content?: string }) => void replies.push(r),
  };

  return { i, replies };
}

function ctx(i: object, snapshot: Snapshot | null, r = db()): CommandCtx {
  const { db: d, repo } = r;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the calls the handlers make
  const stand = i as unknown as CommandCtx["i"];

  return { i: stand, guildId: "g", db: d, repo, snapshotSource: () => snapshot };
}

describe("/duel settings", () => {
  test("refuses a member without Manage Server", async () => {
    const { i, replies } = settingsFake(false);
    await settings(ctx(i, null));
    expect(replies[0]?.content).toContain("Manage Server");
  });

  test("saves for a manager", async () => {
    const { i, replies } = settingsFake(true);
    await settings(ctx(i, null));
    expect(replies[0]?.content).toBe(
      "Time zone set to Europe/Paris. Applies from the next puzzle.",
    );
  });
});

function playFake() {
  const order: string[] = [];
  const sent: { flags?: unknown; edited?: { content?: string; components?: unknown[] } | string } =
    {};
  const i = {
    user: { id: "u" },
    deferReply: async (o: { flags?: unknown }) => {
      order.push("deferReply");
      sent.flags = o.flags;
    },
    editReply: async (m: { content?: string } | string) => {
      order.push("editReply");
      sent.edited = m;
    },
  };

  return { i, order, sent };
}

describe("/duel play", () => {
  test("defers privately before it shows the question", async () => {
    const { i, order, sent } = playFake();
    await play(ctx(i, fixtureSnapshot()));
    expect(order).toEqual(["deferReply", "editReply"]);
    expect(sent.flags).toBe(MessageFlags.Ephemeral);
    expect(typeof sent.edited === "object" && sent.edited.components?.length).toBeGreaterThan(0);
  });

  test("says so when the snapshot is missing", async () => {
    const { i, order, sent } = playFake();
    const error = spyOn(log, "error").mockImplementation(() => {});
    await play(ctx(i, null));
    expect(error).toHaveBeenCalledTimes(1);
    error.mockRestore();
    expect(order).toEqual(["deferReply", "editReply"]);
    expect(sent.edited).toBe("Stat duel is unavailable — country data is missing.");
  });

  test("no questions today reply for an empty snapshot", async () => {
    const { i, sent } = playFake();
    const error = spyOn(log, "error").mockImplementation(() => {});
    await play(ctx(i, { builtAt: "", countries: [] }));
    expect(error).toHaveBeenCalledTimes(1);
    error.mockRestore();
    expect(sent.edited).toBe("No questions today — the country data looks broken.");
  });
});

function seeded(over: Parameters<typeof game>[0]) {
  const r = db();
  const date = dateIn(Date.now(), "Europe/Lisbon");
  r.repo.puzzles.create(puzzle({ date }));
  r.repo.games.start(game({ date, answers: "b", ...over }));

  return { r, date };
}

describe("/duel play self-heal", () => {
  test("a full-but-unfinished game is finished, shown and announced", async () => {
    const { r, date } = seeded({});
    const { i, sent } = playFake();
    const posts: { content?: string }[] = [];
    const fake = { ...i, channel: { send: async (m: { content?: string }) => void posts.push(m) } };
    await play(ctx(fake, fixtureSnapshot(), r));
    expect(r.repo.games.get("g", date, "u")?.finishedAt).not.toBeNull();
    expect(typeof sent.edited === "object" && sent.edited.content).toContain("1/1");
    expect(posts).toHaveLength(1);
    expect(posts[0]?.content).toContain("<@u> scored 1/1");
  });

  test("an already-finished game is shown without an announce", async () => {
    const { r } = seeded({ correct: 1, points: 10, streak: 1, finishedAt: 5 });
    const { i } = playFake();
    const posts: unknown[] = [];
    const fake = { ...i, channel: { send: async (m: unknown) => void posts.push(m) } };
    await play(ctx(fake, fixtureSnapshot(), r));
    expect(posts).toHaveLength(0);
  });
});

describe("/duel routing and the page commands", () => {
  test("outside a server it says so", async () => {
    const replies: { content?: string }[] = [];
    const i = {
      guildId: null,
      options: { getSubcommand: () => "play" },
      reply: async (r: { content?: string }) => void replies.push(r),
    };
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- stand-ins for the calls execute makes
    await duelCommand(() => null).execute(i as never, { db: db().db } as never);
    expect(replies[0]?.content).toBe("Stat duel works in a server.");
  });

  test("leaderboard replies publicly with a page that pings no one", async () => {
    const replies: { content?: string; allowedMentions?: unknown }[] = [];
    const i = {
      user: { id: "u" },
      options: { getString: () => null, getInteger: () => null },
      reply: async (r: { content?: string }) => void replies.push(r),
    };
    await leaderboard(ctx(i, null));
    expect(replies[0]?.content).toContain("No games finished yet");
    expect(replies[0]?.allowedMentions).toEqual({ parse: [] });
  });

  test("stats replies privately with the asker's numbers", async () => {
    const replies: { content?: string; flags?: unknown }[] = [];
    const i = {
      user: { id: "u", displayName: "Una" },
      options: { getUser: () => null },
      reply: async (r: { content?: string }) => void replies.push(r),
    };
    await stats(ctx(i, null));
    expect(replies[0]?.flags).toBe(MessageFlags.Ephemeral);
    expect(replies[0]?.content).toContain("Una");
  });
});
