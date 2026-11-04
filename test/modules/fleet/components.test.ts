import { expect, test } from "bun:test";
import { ComponentType, type MessageComponentInteraction, MessageFlags } from "discord.js";
import type { Jev } from "../../../src/core/jev/types.ts";
import type { ComponentHandler, Ctx } from "../../../src/core/types.ts";
import { startThinking, stopThinking } from "../../../src/modules/four/thinking.ts";
import { fleetKey } from "../../../src/modules/fleet/commands/play.ts";
import { fleetModule } from "../../../src/modules/fleet/index.ts";
import type { FleetRepo } from "../../../src/modules/fleet/store/repo.ts";
import type { Game } from "../../../src/modules/fleet/types.ts";
import { viewText } from "../crossword/view-text.ts";
import { playing, rowsFleet } from "./fixtures.ts";
import { repo, shotGame } from "./store/repo.ts";

/** A message as the handlers send it: Components V2, its text and the attached picture. */
interface Sent {
  components?: unknown[];
  flags?: number;
  content?: string | null;
  embeds?: unknown[];
  files?: { name: string }[];
  attachments?: unknown[];
}

interface Seen {
  updates: Sent[];
  edits: Sent[];
  messageEdits: Sent[];
  posts: Sent[];
  /** Edits of other messages in the channel (the fleet message), by id. */
  channelEdits: { id: string; m: Sent }[];
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
  sendFails?: boolean;
  /** The board message's components as Discord holds them. */
  board?: { type: ComponentType }[];
}

function fakeChannel(seen: Seen, p: ClickOpts) {
  return {
    isSendable: () => true,
    send: async (m: Sent) => {
      if (p.sendFails) throw new Error("Missing Permissions");

      seen.posts.push(m);

      return { id: "f1" };
    },
    messages: { edit: async (id: string, m: Sent) => void seen.channelEdits.push({ id, m }) },
  };
}

function fakeClick(seen: Seen, p: ClickOpts) {
  const fake = {
    user: { id: p.userId ?? "u" },
    message: {
      id: "m",
      components: p.board ?? [],
      edit: async (m: Sent) => void seen.messageEdits.push(m),
    },
    channel: fakeChannel(seen, p),
    values: p.values ?? [],
    isStringSelectMenu: () => p.values !== undefined,
    update: async (m: Sent) => void seen.updates.push(m),
    editReply: async (m: Sent) => {
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
  posts: [],
  channelEdits: [],
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
  expect(viewText(seen.updates[0])).toContain("jevos is aiming…");
  expect(viewText(seen.edits[0])).toContain("jevos fired at");
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
  const seen = await click(s, "fleet:row:5");
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
  expect(viewText(seen.updates[0])).toContain("You resigned.");
  expect(s.r.results.stats("g", "u").resigned).toBe(1);
});

test("a failed edit after jevos's shot falls back to editing the message", async () => {
  const s = setup();
  s.r.games.put(fresh({ cursor: 11 }));
  const seen = await click(s, "fleet:fire", { editFails: true });
  expect(viewText(seen.messageEdits[0])).toContain("jevos fired at");
  expect(picture(seen.messageEdits[0])).toEqual(FLEET_PNG);
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

const placed = () => fresh({ phase: "placing", player: { ships: rowsFleet(), shots: [] } });

const picture = (m: Sent | undefined) => ({
  files: m?.files?.map((f) => f.name),
  all: m?.attachments,
  v2: m?.flags === MessageFlags.IsComponentsV2,
  // Cleared, so an edit turns a board sent before V2 into the V2 view.
  content: m?.content,
  embeds: m?.embeds,
});

const FLEET_PNG = { files: ["fleet.png"], all: [], v2: true, content: null, embeds: [] };

test("Ready posts your fleet under the board once; jevos's shots edit it", async () => {
  const s = setup();
  s.r.games.put(placed());
  const seen = await click(s, "fleet:ready");
  expect(live(s.r)?.phase).toBe("playing");
  expect(picture(seen.updates[0])).toEqual(FLEET_PNG);
  expect(viewText(seen.posts[0])).toContain("your fleet");
  expect(seen.posts[0]?.files?.map((f) => f.name)).toEqual(["fleet.png"]);
  expect(seen.posts[0]?.flags).toBe(MessageFlags.IsComponentsV2);
  expect(live(s.r)?.fleetMessageId).toBe("f1");
  const turn = await click(s, "fleet:fire");
  expect(turn.posts).toEqual([]);
  expect(turn.channelEdits.map((e) => [e.id, e.m.attachments])).toEqual([["f1", []]]);
  expect(viewText(turn.edits[0])).toContain("jevos fired at");
});

test("moving the cursor leaves your fleet message alone", async () => {
  const s = setup();
  s.r.games.put(fresh({ fleetMessageId: "f" }));
  const seen = await click(s, "fleet:col:4");
  expect([seen.posts, seen.channelEdits]).toEqual([[], []]);
});

test("every board update and edit replaces the picture", async () => {
  const s = setup();
  s.r.games.put(fresh({ cursor: 11, fleetMessageId: "f" }));
  const turn = await click(s, "fleet:fire");
  expect(picture(turn.updates[0])).toEqual(FLEET_PNG);
  expect(picture(turn.edits[0])).toEqual(FLEET_PNG);
  const move = await click(s, "fleet:col:4");
  expect(picture(move.updates[0])).toEqual(FLEET_PNG);
  const end = await click(s, "fleet:resign");
  expect(picture(end.updates[0])).toEqual(FLEET_PNG);
  expect([...turn.posts, ...move.posts, ...end.posts]).toEqual([]);
});

test("a game from before the second message gets one on its next click", async () => {
  const s = setup();
  s.r.games.put(fresh());
  expect((await click(s, "fleet:row:3")).posts).toHaveLength(1);
  expect(live(s.r)?.fleetMessageId).toBe("f1");
  expect((await click(s, "fleet:row:4")).posts).toEqual([]);
});

test("a fleet message that can't be posted leaves the board playable and is tried again", async () => {
  const s = setup();
  s.r.games.put(placed());
  const seen = await click(s, "fleet:ready", { sendFails: true });
  expect(picture(seen.updates[0])).toEqual(FLEET_PNG);
  expect(live(s.r)?.fleetMessageId).toBeNull();
  expect((await click(s, "fleet:row:3")).posts).toHaveLength(1);
});

test("a V2 board whose game is gone loses only its controls, keeping the card", async () => {
  const s = setup();
  const board = [{ type: ComponentType.Container }, { type: ComponentType.ActionRow }];
  const seen = await click(s, "fleet:fire", { board });
  expect(seen.updates).toEqual([{ components: [{ type: ComponentType.Container }] }]);
  expect(seen.replies).toEqual(["This game is over."]);
});

test("a letter or number button moves the cursor; an old board's select still does", async () => {
  const s = setup();
  s.r.games.put(fresh({ cursor: 0 }));
  await click(s, "fleet:col:4");
  expect(live(s.r)?.cursor).toBe(4);
  await click(s, "fleet:row:6");
  expect(live(s.r)?.cursor).toBe(64);
  await click(s, "fleet:row", { values: ["2"] });
  expect(live(s.r)?.cursor).toBe(24);
});
