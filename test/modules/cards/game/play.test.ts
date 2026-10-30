import { expect, test } from "bun:test";
import { join } from "../../../../src/modules/cards/game/lobby.ts";
import { allPlayed, openVoting, playCard } from "../../../../src/modules/cards/game/play.ts";
import type { Game } from "../../../../src/modules/cards/game/types.ts";
import { T0, deck, started } from "../fixtures.ts";

const play = (g: Game, userId: string, index = 0) =>
  playCard(g, { roundId: g.round?.id ?? "", userId, index });

test("a card is played once, from the hand", () => {
  const g = started();
  const card = g.players[0]?.hand[2];

  expect(play(g, "u1", 2)).toBe("played");
  expect(
    g.round?.plays
      .get("u1")
      ?.map((c) => c.id)
      .join(),
  ).toBe(card?.id);
  expect(g.players[0]?.hand).toHaveLength(6);
  expect(play(g, "u1")).toBe("already");
});

test("a two-blank prompt takes two picks, in order", () => {
  const g = started({ deck: deck(1, 60, 1) });
  const [a, b] = g.players[0]?.hand ?? [];

  expect(play(g, "u1", 0)).toBe("first");
  expect(play(g, "u1", 0)).toBe("played");
  expect(
    g.round?.plays
      .get("u1")
      ?.map((c) => c.id)
      .join(),
  ).toBe(`${a?.id},${b?.id}`);
});

test("old buttons, closed phases and outsiders are refused", () => {
  const g = started();

  expect(playCard(g, { roundId: "1-0", userId: "u1", index: 0 })).toBe("stale");
  expect(play(g, "u9")).toBe("not-in");
  expect(play(g, "u1", 7)).toBe("stale");

  g.phase = "voting";
  expect(play(g, "u1")).toBe("closed");
});

test("a mid-round joiner can't play yet and isn't waited for", () => {
  const g = started();
  join(g, { userId: "u4", name: "Di" }, Math.random);

  expect(play(g, "u4")).toBe("not-in");

  for (const id of ["u1", "u2", "u3"]) play(g, id);

  expect(allPlayed(g)).toBe(true);
});

test("fewer than two plays voids the round and gives the cards back", () => {
  const g = started({ deck: deck(1, 60, 1) });
  play(g, "u1");
  play(g, "u2");
  play(g, "u2");

  expect(openVoting(g, T0, Math.random)).toBe("void");
  expect(g.players.map((p) => p.hand.length)).toEqual([7, 7, 7]);
});

test("with two plays voting opens, unfinished picks go back to the hand", () => {
  const g = started({ deck: deck(1, 60, 1) });

  for (const id of ["u1", "u2"]) {
    play(g, id);
    play(g, id);
  }

  play(g, "u3");

  expect(openVoting(g, T0, Math.random)).toBe("voting");
  expect(g.phase).toBe("voting");
  expect(g.round?.order.toSorted()).toEqual(["u1", "u2"]);
  expect(g.players[2]?.hand).toHaveLength(7);
  expect(g.deadline).toBe(T0 + 30_000);
});
