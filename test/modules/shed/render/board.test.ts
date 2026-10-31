import { expect, test } from "bun:test";
import { newGame } from "../../../../src/modules/shed/game/new.ts";
import { boardMessage } from "../../../../src/modules/shed/render/board.ts";
import { lobbyMessage } from "../../../../src/modules/shed/render/lobby.ts";
import { card } from "../testing/cards.ts";
import { table } from "../testing/table.ts";
import { ids, text } from "./ids.ts";

const filler = () => [card("yellow", "1"), card("yellow", "2")];
const three = () => table([filler(), filler(), filler()], card("red", "7"));

test("the lobby: players out of 8, stacking, and its four buttons", () => {
  const starter = { userId: "u1", name: "P1" };
  const g = newGame({ id: 1, guildId: "g", channelId: "c", starter, stacking: true, now: 0 });
  const m = lobbyMessage(g);
  expect(text(m)).toContain("(1/8)");
  expect(text(m)).toContain("Stacking: on");
  expect(ids(m)).toEqual(["shed:join", "shed:leave", "shed:start", "shed:stacking"]);
});

test("the board shows the waiting draw and the turn's seconds, rounded up to 10", () => {
  const g = three();
  g.pending = { kind: "plus2", total: 6 };
  const t = text(boardMessage(g, 21_000));
  expect(t).toContain("+6 waiting on P1");
  expect(t).toContain("40 s");
});

test("dropped seats are struck through; place 1 gets 🥇", () => {
  const g = three();
  g.seats[1] = { ...g.seats[1]!, dropped: true };
  g.seats[2] = { ...g.seats[2]!, place: 1 };
  const t = text(boardMessage(g, 0));
  expect(t).toContain("~~P2~~");
  expect(t).toContain("🥇 P3");
});

test("Catch shows only while someone is on one uncalled card", () => {
  const g = three();
  expect(ids(boardMessage(g, 0))).toEqual(["shed:hand", "shed:quit"]);
  g.seats[1] = { ...g.seats[1]!, catchable: true, hand: [card("blue", "3")] };
  expect(ids(boardMessage(g, 0))).toEqual(["shed:hand", "shed:catch:1", "shed:quit"]);
});

test("a Paint on top shows its colour", () => {
  const g = table([filler(), filler()], card(null, "paint"), { colour: "green" });
  expect(text(boardMessage(g, 0))).toContain("🎨 Paint → 🟩");
});

test("game over: places with points, no buttons", () => {
  const g = three();
  g.phase = "over";
  g.endReason = "done";
  g.seats = g.seats.map((s, i) => ({ ...s, place: i + 1 }));
  const m = boardMessage(g, 0);
  expect(text(m)).toContain("🥇 P1 — 2 pts");
  expect(text(m)).toContain("🥉 P3 — 0 pts");
  expect(ids(m)).toEqual([]);
});
