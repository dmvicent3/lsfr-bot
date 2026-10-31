import { expect, test } from "bun:test";
import { pickColour } from "../../../../src/modules/shed/game/paint.ts";
import { playCards } from "../../../../src/modules/shed/game/play.ts";
import { card } from "../testing/cards.ts";
import { act, hand, table, turnOf } from "../testing/table.ts";

const filler = () => [card("yellow", "1"), card("yellow", "2")];
const play = (
  g: ReturnType<typeof table>,
  userId: string,
  key: string,
  o: { count?: number; last?: boolean } = {},
) => playCards(g, { ...act(g, userId), key, count: o.count ?? 1, last: o.last ?? false });

test("play a matching card: hand shrinks, top changes, turn moves on", () => {
  const g = table([[card("red", "2"), ...filler()], filler(), filler()], card("red", "7"));
  expect(play(g, "u1", "red-2")).toBe("played");
  expect(hand(g, "u1")).toHaveLength(2);
  expect(g.discard.at(-1)?.value).toBe("2");
  expect(turnOf(g)).toBe("u2");
  expect(g.turnNo).toBe(2);
});

test("illegal, not your turn and stale clicks change nothing", () => {
  const g = table([[card("blue", "2"), ...filler()], filler()], card("red", "7"));
  expect(play(g, "u1", "blue-2")).toBe("illegal");
  expect(play(g, "u2", "yellow-1")).toBe("not-your-turn");
  expect(playCards(g, { ...act(g, "u1"), turnNo: 0, key: "blue-2", count: 1, last: false })).toBe(
    "stale",
  );
  expect(play(g, "u1", "green-9")).toBe("not-held");
  expect(hand(g, "u1")).toHaveLength(3);
  expect(turnOf(g)).toBe("u1");
});

test("duplicates go down together; not with stacking off, not more than held", () => {
  const two = () => [card("red", "7"), card("red", "7"), ...filler()];
  const g = table([two(), filler()], card("red", "1"));
  expect(play(g, "u1", "red-7", { count: 3 })).toBe("not-held");
  expect(play(g, "u1", "red-7", { count: 2 })).toBe("played");
  expect(g.discard.slice(-2).map((c) => c.value)).toEqual(["7", "7"]);
  const off = table([two(), filler()], card("red", "1"), { stacking: false });
  expect(play(off, "u1", "red-7", { count: 2 })).toBe("no-stacking");
});

test("two blocks skip two; two turns change nothing; a turn with two players is a block", () => {
  const blocks = [card("red", "block"), card("red", "block"), ...filler()];
  const g = table([blocks, filler(), filler(), filler()], card("red", "1"));
  play(g, "u1", "red-block", { count: 2 });
  expect(turnOf(g)).toBe("u4");
  const turns = [card("red", "turn"), card("red", "turn"), ...filler()];
  const h = table([turns, filler(), filler()], card("red", "1"));
  play(h, "u1", "red-turn", { count: 2 });
  expect(h.direction).toBe(1);
  expect(turnOf(h)).toBe("u2");
  const duo = table([[card("red", "turn"), ...filler()], filler()], card("red", "1"));
  play(duo, "u1", "red-turn");
  expect(turnOf(duo)).toBe("u1");
});

test("a +2 waits on the next player; another colour's +2 answers it and passes it on", () => {
  const g = table(
    [
      [card("red", "plus2"), ...filler()],
      [card("blue", "plus2"), card("red", "5"), ...filler()],
      filler(),
    ],
    card("red", "1"),
  );
  play(g, "u1", "red-plus2");
  expect(g.pending).toEqual({ kind: "plus2", total: 2 });
  expect(turnOf(g)).toBe("u2");
  expect(play(g, "u2", "red-5")).toBe("illegal");
  expect(play(g, "u2", "blue-plus2")).toBe("played");
  expect(g.pending).toEqual({ kind: "plus2", total: 4 });
  expect(turnOf(g)).toBe("u3");
});

test("stacking off: a +2 makes the next player draw 2 and miss the turn at once", () => {
  const g = table([[card("red", "plus2"), ...filler()], filler(), filler()], card("red", "1"), {
    stacking: false,
  });
  play(g, "u1", "red-plus2");
  expect(g.pending).toBeNull();
  expect(hand(g, "u2")).toHaveLength(4);
  expect(turnOf(g)).toBe("u3");
});

test("a Paint asks for a colour; the pick sets it and moves the turn", () => {
  const g = table([[card(null, "paint"), ...filler()], filler()], card("red", "1"));
  expect(play(g, "u1", "x-paint")).toBe("pick-colour");
  expect(g.step).toBe("paint");
  expect(turnOf(g)).toBe("u1");
  expect(pickColour(g, { ...act(g, "u1"), colour: "green" })).toBe("picked");
  expect(g.colour).toBe("green");
  expect(turnOf(g)).toBe("u2");
});

test("two Paint +4s make a waiting 8, one colour pick", () => {
  const g = table(
    [[card(null, "paint4"), card(null, "paint4"), ...filler()], filler(), filler()],
    card("red", "1"),
  );
  expect(play(g, "u1", "x-paint4", { count: 2 })).toBe("pick-colour");
  pickColour(g, { ...act(g, "u1"), colour: "blue" });
  expect(g.pending).toEqual({ kind: "paint4", total: 8 });
  expect(turnOf(g)).toBe("u2");
});

test("going out: placed 1st, out of the turn order, the game goes on with 2 left", () => {
  const g = table([[card("red", "2")], filler(), filler()], card("red", "7"));
  play(g, "u1", "red-2");
  expect(g.seats[0]?.place).toBe(1);
  expect(g.phase).toBe("playing");
  expect(turnOf(g)).toBe("u2");
});

test("out on an action leaving one: the game ends at once, no waiting draw", () => {
  const g = table([[card("red", "plus2")], filler()], card("red", "7"));
  play(g, "u1", "red-plus2");
  expect(g.phase).toBe("over");
  expect(g.endReason).toBe("done");
  expect(g.pending).toBeNull();
  expect(g.seats.map((s) => s.place)).toEqual([1, 2]);
});

test("out on a Paint: no colour to pick, anything plays next", () => {
  const g = table([[card(null, "paint")], filler(), filler()], card("red", "7"));
  expect(play(g, "u1", "x-paint")).toBe("played");
  expect(g.colour).toBeNull();
  expect(turnOf(g)).toBe("u2");
});
