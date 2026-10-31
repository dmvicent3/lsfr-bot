import { expect, test } from "bun:test";
import type { MessageComponentInteraction } from "discord.js";
import type { Jev } from "../../../src/core/jev/types.ts";
import type { ComponentHandler, Ctx } from "../../../src/core/types.ts";
import { startThinking, stopThinking } from "../../../src/modules/four/thinking.ts";
import { fleetKey } from "../../../src/modules/fleet/commands/play.ts";
import { fleetModule } from "../../../src/modules/fleet/index.ts";
import type { FleetRepo } from "../../../src/modules/fleet/store/repo.ts";
import type { Game } from "../../../src/modules/fleet/types.ts";
import { playing, rowsFleet } from "./fixtures.ts";
import { repo, shotGame } from "./store/repo.ts";

interface Seen {
  updates: { components?: unknown[]; embeds?: { description?: string }[] }[];
  edits: { embeds?: { description?: string }[] }[];
  messageEdits: { embeds?: { description?: string }[] }[];
  replies: string[];
  deferred: number;
}

const noJev: Jev = { yesNo: async () => new Map() };

function setup(jev: Jev = noJev, random = () => 0.9) {
  const { db, repo: r } = repo();
  const handlers = new Map(
    (fleetModule(jev, random).components ?? []).map((h): [string, ComponentHandler] => [h.id, h]),
  );
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- handlers only read ctx.db
  const ctx = { db } as unknown as Ctx;

  return { r, handlers, ctx };
}

interface ClickOpts {
  userId?: string;
  values?: string[];
  editFails?: boolean;
}

function fakeClick(seen: Seen, p: ClickOpts) {
  const fake = {
    user: { id: p.userId ?? "u" },
    message: {
      id: "m",
      components: [],
      edit: async (m: Seen["edits"][number]) => void seen.messageEdits.push(m),
    },
    values: p.values ?? [],
    isStringSelectMenu: () => p.values !== undefined,
    update: async (m: Seen["updates"][number]) => void seen.updates.push(m),
    editReply: async (m: Seen["edits"][number]) => {
      if (p.editFails) throw new Error("Unknown Webhook");

      seen.edits.push(m);
    },
    reply: async (m: { content: string }) => void seen.replies.push(m.content),
    followUp: async (m: { content: string }) => void seen.replies.push(m.content),
    deferUpdate: async () => void seen.deferred++,
  };

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for a click
  return fake as unknown as MessageComponentInteraction;
}

const newSeen = (): Seen => ({
  updates: [],
  edits: [],
  messageEdits: [],
  replies: [],
  deferred: 0,
});

type Setup = ReturnType<typeof setup>;

async function click(s: Setup, customId: string, p: ClickOpts = {}) {
  const seen = newSeen();
  const [module, action, ...args] = customId.split(":");
  await s.handlers.get(`${module}:${action}`)?.handle(fakeClick(seen, p), args, s.ctx);

  return seen;
}

const live = (r: FleetRepo): Game | null => r.games.get("g", "u");

const fresh = (over: Partial<Game> = {}) => playing({ updatedAt: Date.now(), ...over });

test("a full turn: Fire, then jevos's shot on the board", async () => {
  const s = setup();
  s.r.games.put(fresh({ cursor: 11 }));
  const seen = await click(s, "fleet:fire");
  expect(seen.updates[0]?.embeds?.[0]?.description).toContain("jevos is aiming…");
  expect(seen.edits[0]?.embeds?.[0]?.description).toContain("jevos fired at");
  expect(live(s.r)?.player.shots).toEqual([11]);
  expect(live(s.r)?.jevos.shots).toHaveLength(1);
});

test("a second click while jevos aims is refused", async () => {
  const asked = Promise.withResolvers<void>();
  const answers = Promise.withResolvers<Map<string, number>>();
  let calls = 0;
  const jev: Jev = {
    yesNo: () => {
      calls++;
      asked.resolve();

      return answers.promise;
    },
  };
  const s = setup(jev);
  s.r.games.put(fresh({ cursor: 11 }));
  const first = click(s, "fleet:fire");
  await asked.promise;
  const second = await click(s, "fleet:fire");
  expect(second.replies).toEqual(["jevos is still aiming."]);
  answers.resolve(new Map());
  await first;
  expect(calls).toBe(1);
});

test("after a restart mid-turn the next click fires jevos first", async () => {
  const s = setup();
  s.r.games.put(fresh({ player: { ships: rowsFleet(), shots: [11] } }));
  const seen = await click(s, "fleet:row", { values: ["5"] });
  expect(live(s.r)?.jevos.shots).toHaveLength(1);
  expect(seen.edits).toHaveLength(1);
});

test("placement controls during play and Fire during placing do nothing", async () => {
  const s = setup();
  const game = fresh();
  s.r.games.put(game);

  for (const id of ["fleet:place", "fleet:undo", "fleet:random", "fleet:ready"]) {
    expect((await click(s, id)).deferred).toBe(1);
  }

  const placing = fresh({ phase: "placing", player: { ships: [], shots: [] } });
  s.r.games.put(placing);
  expect((await click(s, "fleet:fire")).deferred).toBe(1);
  expect(live(s.r)).toEqual(placing);
});

test("someone else's click, and an old board", async () => {
  const s = setup();
  s.r.games.put(fresh());
  expect((await click(s, "fleet:fire", { userId: "x" })).replies[0]).toStartWith(
    "This is <@u>'s game.",
  );
  s.r.games.remove("g", "u");
  expect((await click(s, "fleet:fire")).replies).toEqual(["This game is over."]);
});

test("placing: place, refuse an overlap, then Ready with jevos first fires straight away", async () => {
  const s = setup(noJev, () => 0.2);
  s.r.games.put(fresh({ phase: "placing", player: { ships: [], shots: [] } }));
  await click(s, "fleet:place");
  expect(live(s.r)?.player.ships).toHaveLength(1);
  expect((await click(s, "fleet:place")).replies).toEqual(["That ship would overlap another."]);
  await click(s, "fleet:random");
  expect(live(s.r)?.player.ships).toHaveLength(5);
  const seen = await click(s, "fleet:ready");
  expect(live(s.r)?.phase).toBe("playing");
  expect(live(s.r)?.jevos.shots).toHaveLength(1);
  expect(seen.edits).toHaveLength(1);
});

test("resign with no shot leaves no result; with shots records a loss", async () => {
  const s = setup();
  s.r.games.put(fresh());
  await click(s, "fleet:resign");
  expect(live(s.r)).toBeNull();
  expect(s.r.results.stats("g", "u").resigned).toBe(0);
  s.r.games.put({
    ...shotGame("u", { shots: 2, hits: 0, difficulty: "easy" }),
    messageId: "m",
    updatedAt: Date.now(),
  });
  const seen = await click(s, "fleet:resign");
  expect(seen.updates[0]?.embeds?.[0]?.description).toContain("You resigned.");
  expect(s.r.results.stats("g", "u").resigned).toBe(1);
});

test("a failed edit after jevos's shot falls back to editing the message", async () => {
  const s = setup();
  s.r.games.put(fresh({ cursor: 11 }));
  const seen = await click(s, "fleet:fire", { editFails: true });
  expect(seen.messageEdits[0]?.embeds?.[0]?.description).toContain("jevos fired at");
});

test("a click while another click is still updating says so, without blaming jevos", async () => {
  const s = setup();
  s.r.games.put(fresh({ phase: "placing", player: { ships: [], shots: [] } }));
  const key = fleetKey("g", "u");
  startThinking(key);

  try {
    expect((await click(s, "fleet:place")).replies).toEqual(["One moment…"]);
  } finally {
    stopThinking(key);
  }
});
