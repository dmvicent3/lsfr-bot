import { expect, test } from "bun:test";
import { openVoting, playCard } from "../../../../src/modules/cards/game/play.ts";
import type { Game } from "../../../../src/modules/cards/game/types.ts";
import { allVoted, castVote } from "../../../../src/modules/cards/game/vote.ts";
import { T0, cardAt, started } from "../fixtures.ts";

function voting(): Game {
  const g = started();

  for (const id of ["u1", "u2", "u3"])
    playCard(g, { roundId: g.round?.id ?? "", userId: id, cardId: cardAt(g, id) });

  openVoting(g, T0, Math.random);

  return g;
}

const vote = (g: Game, userId: string, author: string) =>
  castVote(g, { roundId: g.round?.id ?? "", userId, index: g.round?.order.indexOf(author) ?? -1 });

test("one vote each, changeable, never for your own card", () => {
  const g = voting();

  expect(vote(g, "u1", "u1")).toBe("own");
  expect(vote(g, "u1", "u2")).toBe("voted");
  expect(vote(g, "u1", "u3")).toBe("changed");
  expect(g.round?.votes.get("u1")).toBe("u3");
});

test("outsiders, old buttons and closed votes are refused", () => {
  const g = voting();

  expect(vote(g, "u9", "u2")).toBe("not-in");
  expect(castVote(g, { roundId: "1-0", userId: "u1", index: 0 })).toBe("stale");

  g.phase = "reveal";
  expect(vote(g, "u1", "u2")).toBe("closed");
});

test("voting is done once every player has voted", () => {
  const g = voting();
  vote(g, "u1", "u2");
  vote(g, "u2", "u1");

  expect(allVoted(g)).toBe(false);

  vote(g, "u3", "u1");
  expect(allVoted(g)).toBe(true);
});
