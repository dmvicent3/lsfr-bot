import { expect, test } from "bun:test";
import {
  join,
  leaveLobby,
  startGame,
  toggleStacking,
} from "../../../../src/modules/shed/game/lobby.ts";
import { newGame } from "../../../../src/modules/shed/game/new.ts";
import { LOBBY_MS } from "../../../../src/modules/shed/game/types.ts";
import { seeded } from "../testing/random.ts";

const who = (n: number) => ({ userId: `u${n}`, name: `P${n}` });
const lobby = () =>
  newGame({ id: 1, guildId: "g", channelId: "c", starter: who(1), stacking: true, now: 0 });

test("a new game: the starter seated, a lobby that closes in 10 minutes", () => {
  const g = lobby();
  expect(g.phase).toBe("lobby");
  expect(g.seats.map((s) => s.userId)).toEqual(["u1"]);
  expect(g.lobbyEndsAt).toBe(LOBBY_MS);
  expect(g.stacking).toBe(true);
});

test("join: once, up to 8, not elsewhere, not after the start", () => {
  const g = lobby();
  expect(join(g, who(1), false)).toBe("already");
  expect(join(g, who(2), true)).toBe("elsewhere");

  for (let n = 2; n <= 8; n++) expect(join(g, who(n), false)).toBe("joined");

  expect(join(g, who(9), false)).toBe("full");
  const h = lobby();
  join(h, who(2), false);
  startGame(h, "u1", 0, seeded(1));
  expect(join(h, who(3), false)).toBe("started");
});

test("start: only the starter, at least 2 players, once", () => {
  const g = lobby();
  expect(startGame(g, "u1", 0, seeded(1))).toBe("too-few");
  join(g, who(2), false);
  expect(startGame(g, "u2", 0, seeded(1))).toBe("not-starter");
  expect(startGame(g, "u1", 0, seeded(1))).toBe("started");
  expect(g.phase).toBe("playing");
  expect(startGame(g, "u1", 0, seeded(1))).toBe("started-already");
});

test("stacking: only the starter flips it, only in the lobby", () => {
  const g = lobby();
  join(g, who(2), false);
  expect(toggleStacking(g, "u2")).toBe("not-starter");
  expect(toggleStacking(g, "u1")).toBe("off");
  expect(g.stacking).toBe(false);
  expect(toggleStacking(g, "u1")).toBe("on");
  startGame(g, "u1", 0, seeded(1));
  expect(toggleStacking(g, "u1")).toBe("started");
});

test("the starter leaving hands the start on; the last one leaving closes the lobby", () => {
  const g = lobby();
  join(g, who(2), false);
  expect(leaveLobby(g, "u3")).toBe("not-in");
  expect(leaveLobby(g, "u1")).toBe("left");
  expect(g.startedBy).toBe("u2");
  expect(leaveLobby(g, "u2")).toBe("left");
  expect(g.phase).toBe("over");
  expect(g.endReason).toBe("lobby");
});
