import { expect, test } from "bun:test";
import { advance } from "../../../../src/modules/cards/game/clock.ts";
import { leave } from "../../../../src/modules/cards/game/lobby.ts";
import { playCard } from "../../../../src/modules/cards/game/play.ts";
import type { Game } from "../../../../src/modules/cards/game/types.ts";
import { castVote } from "../../../../src/modules/cards/game/vote.ts";
import { T0, deck, game, started } from "../fixtures.ts";

const playAll = (g: Game, ids: string[]) => {
  for (const id of ids) playCard(g, { roundId: g.round?.id ?? "", userId: id, index: 0 });
};

test("an unstarted lobby closes after 5 minutes", () => {
  const g = game();

  expect(advance(g, T0 + 60_000, Math.random)).toBeNull();
  expect(advance(g, T0 + 5 * 60_000, Math.random)).toBe("lobby-expired");
  expect(g.endReason).toBe("lobby");
});

test("voting opens as soon as everyone has played, else at 60 s", () => {
  const g = started({ deck: deck(10, 60, 10) });
  playCard(g, { roundId: g.round?.id ?? "", userId: "u1", index: 0 });

  expect(advance(g, T0 + 1_000, Math.random)).toBeNull();

  playAll(g, ["u1", "u2"]);
  playAll(g, ["u2"]);
  expect(advance(g, T0 + 60_000, Math.random)).toBe("voting");
});

test("a round with one play is void and the next one opens", () => {
  const g = started();
  playAll(g, ["u1"]);

  expect(advance(g, T0 + 60_000, Math.random)).toBe("void");
  expect(g.rounds).toBe(2);
});

test("all votes in → reveal, then the next round after 8 s", () => {
  const g = started();
  playAll(g, ["u1", "u2", "u3"]);
  advance(g, T0 + 1_000, Math.random);

  for (const [voter, author] of [
    ["u1", "u2"],
    ["u2", "u1"],
    ["u3", "u1"],
  ] as const)
    castVote(g, {
      roundId: g.round?.id ?? "",
      userId: voter,
      index: g.round?.order.indexOf(author) ?? -1,
    });

  expect(advance(g, T0 + 2_000, Math.random)).toBe("reveal");
  expect(advance(g, T0 + 5_000, Math.random)).toBeNull();
  expect(advance(g, T0 + 10_000, Math.random)).toBe("next");
});

test("down to 2 players mid-vote ends the game on the next tick", () => {
  const g = started();
  playAll(g, ["u1", "u2", "u3"]);
  advance(g, T0 + 1_000, Math.random);
  leave(g, "u3");

  expect(advance(g, T0 + 2_000, Math.random)).toBe("over");
  expect(g.endReason).toBe("players");
});

test("reaching the target ends the game after the reveal", () => {
  const g = started({ target: 1 });
  playAll(g, ["u1", "u2", "u3"]);
  advance(g, T0 + 1_000, Math.random);
  castVote(g, {
    roundId: g.round?.id ?? "",
    userId: "u2",
    index: g.round?.order.indexOf("u1") ?? -1,
  });
  advance(g, T0 + 31_000, Math.random);

  expect(advance(g, T0 + 40_000, Math.random)).toBe("over");
  expect(g.endReason).toBe("target");
});
