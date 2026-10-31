import { expect, test } from "bun:test";
import { advance } from "../../../../src/modules/shed/game/clock.ts";
import { newGame } from "../../../../src/modules/shed/game/new.ts";
import { pickColour } from "../../../../src/modules/shed/game/paint.ts";
import { playCards } from "../../../../src/modules/shed/game/play.ts";
import { quitGame } from "../../../../src/modules/shed/game/quit.ts";
import { TURN_MS } from "../../../../src/modules/shed/game/types.ts";
import { card } from "../testing/cards.ts";
import { seeded } from "../testing/random.ts";
import { act, hand, table, turnOf } from "../testing/table.ts";

const filler = () => [card("yellow", "1"), card("yellow", "2")];
const tick = (g: ReturnType<typeof table>) => advance(g, g.turnEndsAt, seeded(3));

test("turn timeout draws one and passes", () => {
  const g = table([filler(), filler()], card("red", "7"));
  expect(advance(g, TURN_MS - 1, seeded(3))).toBeNull();
  expect(tick(g)).toBe("timed-out");
  expect(hand(g, "u1")).toHaveLength(3);
  expect(g.seats[0]?.idle).toBe(1);
  expect(turnOf(g)).toBe("u2");
});

test("timeout with a waiting draw takes it", () => {
  const g = table([filler(), filler()], card("red", "plus2"));
  g.pending = { kind: "plus2", total: 4 };
  tick(g);
  expect(hand(g, "u1")).toHaveLength(6);
  expect(g.pending).toBeNull();
  expect(turnOf(g)).toBe("u2");
});

test("timeout while picking a colour picks the most-held colour", () => {
  const held = [card(null, "paint"), card("blue", "1"), card("blue", "4"), card("red", "5")];
  const g = table([held, filler()], card("red", "7"));
  playCards(g, { ...act(g, "u1"), key: "x-paint", count: 1, last: false });
  tick(g);
  expect(g.colour).toBe("blue");
  expect(turnOf(g)).toBe("u2");
});

test("3 timeouts in a row drop the player, their cards go to the bottom of the pile", () => {
  const g = table([filler(), filler(), filler()], card("red", "7"));
  g.seats[0] = { ...g.seats[0]!, idle: 2 };
  const mine = hand(g, "u1").map((c) => c.id);
  expect(tick(g)).toBe("dropped");
  expect(g.seats[0]?.dropped).toBe(true);
  expect(g.seats[0]?.place).toBeNull();
  expect(g.draw.slice(0, 2).map((c) => c.id)).toEqual(mine);
  expect(turnOf(g)).toBe("u2");
  expect(g.phase).toBe("playing");
});

test("a play resets the count", () => {
  const g = table([[card("red", "2"), ...filler()], filler()], card("red", "7"));
  g.seats[0] = { ...g.seats[0]!, idle: 2 };
  playCards(g, { ...act(g, "u1"), key: "red-2", count: 1, last: false });
  expect(g.seats[0]?.idle).toBe(0);
});

test("drop with a waiting draw: it waits on the next player", () => {
  const g = table([[card("red", "plus2"), ...filler()], filler(), filler()], card("red", "7"));
  playCards(g, { ...act(g, "u1"), key: "red-plus2", count: 1, last: false });
  expect(quitGame(g, "u2", 0)).toBe("left");
  expect(g.pending).toEqual({ kind: "plus2", total: 2 });
  expect(turnOf(g)).toBe("u3");
  expect(quitGame(g, "u2", 0)).toBe("not-in");
});

test("leaving with two left ends the game; the one left is placed", () => {
  const g = table([filler(), filler()], card("red", "7"));
  quitGame(g, "u1", 0);
  expect(g.phase).toBe("over");
  expect(g.seats.map((s) => s.place)).toEqual([null, 1]);
  expect(quitGame(g, "u2", 0)).toBe("over");
});

test("lobby closes after 10 minutes", () => {
  const starter = { userId: "u1", name: "P1" };
  const g = newGame({ id: 1, guildId: "g", channelId: "c", starter, stacking: true, now: 0 });
  expect(advance(g, 599_999, seeded(1))).toBeNull();
  expect(advance(g, 600_000, seeded(1))).toBe("lobby-closed");
  expect(g.phase).toBe("over");
  expect(g.endReason).toBe("lobby");
});

test("a non-turn Leave during a Paint +4 pick (stacking off) keeps the skip", () => {
  const paint4 = () => [card(null, "paint4"), ...filler()];
  const g = table([paint4(), filler(), filler(), filler()], card("red", "7"), { stacking: false });
  playCards(g, { ...act(g, "u1"), key: "x-paint4", count: 1, last: false });
  quitGame(g, "u4", 0);
  pickColour(g, { ...act(g, "u1"), colour: "blue" });
  expect(turnOf(g)).toBe("u3");
  const h = table([paint4(), filler(), filler(), filler()], card("red", "7"), { stacking: false });
  playCards(h, { ...act(h, "u1"), key: "x-paint4", count: 1, last: false });
  quitGame(h, "u3", 0);
  pickColour(h, { ...act(h, "u1"), colour: "blue" });
  expect(turnOf(h)).toBe("u4");
});
