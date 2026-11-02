import { describe, expect, spyOn, test } from "bun:test";
import { InteractionContextType, MessageFlags } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import type { Snapshot } from "../../../src/core/countries/types.ts";
import { runMigrations } from "../../../src/core/db.ts";
import { log } from "../../../src/core/log.ts";
import { coreMigrations } from "../../../src/core/settings.ts";
import { dateIn } from "../../../src/core/zoned.ts";
import { gridCommand } from "../../../src/modules/grid/commands/commands.ts";
import { data } from "../../../src/modules/grid/commands/data.ts";
import { leaderboard } from "../../../src/modules/grid/commands/leaderboard.ts";
import { play } from "../../../src/modules/grid/commands/play.ts";
import { practice } from "../../../src/modules/grid/commands/practice.ts";
import { settings } from "../../../src/modules/grid/commands/settings.ts";
import { stats } from "../../../src/modules/grid/commands/stats.ts";
import type { CommandCtx } from "../../../src/modules/grid/commands/types.ts";
import { gridModule } from "../../../src/modules/grid/index.ts";
import { seeded } from "../shed/testing/random.ts";
import { snapshot } from "./play/fixtures.ts";
import { freshDb, game, grid, puzzle } from "./store/fixtures.ts";

type Opt = { name: string; required?: boolean; max_length?: number; choices?: { value: string }[] };
type Sub = { name: string; options?: Opt[] };
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the built JSON, read through the shape the tests need
const subs = (data.options ?? []) as unknown as Sub[];
const optionsOf = (name: string): Opt[] => subs.find((s) => s.name === name)?.options ?? [];

describe("/grid data", () => {
  test("five subcommands in a server", () => {
    expect(data.name).toBe("grid");
    expect(data.contexts).toEqual([InteractionContextType.Guild]);
    expect(subs.map((s) => s.name)).toEqual([
      "play",
      "practice",
      "stats",
      "leaderboard",
      "settings",
    ]);
  });

  test("leaderboard has the four periods", () => {
    const o = optionsOf("leaderboard").find((x) => x.name === "period");
    expect(o?.choices?.map((c) => c.value)).toEqual(["today", "week", "month", "all"]);
  });

  test("stats takes an optional user", () => {
    const o = optionsOf("stats");
    expect(o.map((x) => x.name)).toEqual(["user"]);
    expect(o[0]?.required).toBeFalsy();
  });

  test("settings takes a required timezone of at most 64 characters", () => {
    const o = optionsOf("settings").find((x) => x.name === "timezone");
    expect(o?.required).toBe(true);
    expect(o?.max_length).toBe(64);
  });

  test("the module owns its buttons, modal and tables", () => {
    const m = gridModule();
    expect(m.name).toBe("grid");
    expect(m.title).toBe("🗺️ Country grid");
    expect(m.helpNote).toBe(
      "A 3×3 grid of country rules a day, the same for everyone in the server; answers are private. Data: World Bank Open Data (CC BY 4.0), Wikidata (CC0), flags from Wikimedia Commons.",
    );
    expect(m.commands?.map((c) => c.data.name)).toEqual(["grid"]);
    expect(m.components?.length).toBeGreaterThan(0);
    expect(m.modals?.length).toBeGreaterThan(0);
    expect(m.migrations?.length).toBeGreaterThan(0);
  });
});

function db() {
  const r = freshDb();
  runMigrations(r.db, coreMigrations);

  return r;
}

function ctx(i: object, snap: Snapshot | null, r = db()): CommandCtx {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the calls the handlers make
  const stand = i as unknown as CommandCtx["i"];

  return {
    i: stand,
    guildId: "g",
    db: r.db,
    repo: r.repo,
    snapshotSource: () => snap,
    random: seeded(7),
  };
}

function playFake() {
  const order: string[] = [];
  const sent: { flags?: unknown; edited?: { content?: string; components?: unknown[] } | string } =
    {};
  const posts: { content?: string }[] = [];
  const i = {
    user: { id: "u" },
    channel: { send: async (m: { content?: string }) => void posts.push(m) },
    deferReply: async (o: { flags?: unknown }) => {
      order.push("deferReply");
      sent.flags = o.flags;
    },
    editReply: async (m: { content?: string } | string) => {
      order.push("editReply");
      sent.edited = m;
    },
  };

  return { i, order, sent, posts };
}

describe("/grid settings", () => {
  test("refuses a member without Manage Server", async () => {
    const replies: { content?: string }[] = [];
    const i = {
      memberPermissions: { has: () => false },
      options: { getString: () => "Europe/Paris" },
      reply: async (r: { content?: string }) => void replies.push(r),
    };
    await settings(ctx(i, null));
    expect(replies[0]?.content).toContain("Manage Server");
  });
});

describe("/grid play", () => {
  test("defers privately before it shows the grid", async () => {
    const { i, order, sent } = playFake();
    await play(ctx(i, snapshot));
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
    expect(sent.edited).toBe("Country grid is unavailable — country data is missing.");
  });

  test("no grid today reply for an empty snapshot", async () => {
    const { i, sent } = playFake();
    const error = spyOn(log, "error").mockImplementation(() => {});
    await play(ctx(i, { builtAt: "", countries: [] }));
    expect(error).toHaveBeenCalledTimes(1);
    error.mockRestore();
    expect(sent.edited).toBe("No grid today — the country data looks broken.");
  });

  test("a full-but-unfinished game is finished, shown and announced", async () => {
    const r = db();
    const date = dateIn(Date.now(), "Europe/Lisbon");
    r.repo.puzzles.create(puzzle({ date }));
    const cells = grid().answers.map((a) => a[0] ?? "");
    r.repo.games.start(game({ date, cells, guesses: 9 }));
    const { i, posts } = playFake();
    await play(ctx(i, snapshot, r));
    expect(r.repo.games.get("g", date, "u")?.finishedAt).not.toBeNull();
    expect(posts).toHaveLength(1);
    expect(posts[0]?.content).toContain("<@u> filled");
  });
});

describe("/grid practice", () => {
  test("defers privately, opens a practice grid and keeps it", async () => {
    const r = db();
    const { i, order, sent } = playFake();
    await practice(ctx(i, snapshot, r));
    expect(order).toEqual(["deferReply", "editReply"]);
    expect(sent.flags).toBe(MessageFlags.Ephemeral);
    expect(typeof sent.edited === "object" && sent.edited.components?.length).toBeGreaterThan(0);
    expect(r.repo.practice.get("g", "u")).not.toBeNull();
  });

  test("says so when the snapshot is missing", async () => {
    const { i, sent } = playFake();
    const error = spyOn(log, "error").mockImplementation(() => {});
    await practice(ctx(i, null));
    expect(error).toHaveBeenCalledTimes(1);
    error.mockRestore();
    expect(sent.edited).toBe("Country grid is unavailable — country data is missing.");
  });

  test("says so when no practice grid can be built", async () => {
    const { i, sent } = playFake();
    const error = spyOn(log, "error").mockImplementation(() => {});
    await practice(ctx(i, { builtAt: "", countries: [] }));
    expect(error).toHaveBeenCalledTimes(1);
    error.mockRestore();
    expect(sent.edited).toBe("Couldn't build a practice grid. Try again.");
  });
});

describe("/grid routing and the page commands", () => {
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
      ReturnType<typeof gridCommand>["execute"]
    >[1];
    await gridCommand(() => null).execute(stand, rt);
    expect(replies[0]?.content).toBe("Country grid works in a server.");
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
      options: {
        getUser: (name: string) => (name === "user" ? null : { id: "x", displayName: "X" }),
      },
      reply: async (r: { content?: string }) => void replies.push(r),
    };
    await stats(ctx(i, null));
    expect(replies[0]?.flags).toBe(MessageFlags.Ephemeral);
    expect(replies[0]?.content).toContain("Una");
  });
});
