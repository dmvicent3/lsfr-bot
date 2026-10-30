import { expect, test } from "bun:test";
import { openVoting, playCard } from "../../../../src/modules/cards/game/play.ts";
import { closeVoting, endCheck, finishRound } from "../../../../src/modules/cards/game/tally.ts";
import type { Game } from "../../../../src/modules/cards/game/types.ts";
import { castVote } from "../../../../src/modules/cards/game/vote.ts";
import { T0, started } from "../fixtures.ts";

const ids = ["u1", "u2", "u3"];

function voted(g: Game, votes: [string, string][]): void {
  for (const id of ids) playCard(g, { roundId: g.round?.id ?? "", userId: id, index: 0 });

  openVoting(g, T0, Math.random);

  for (const [voter, author] of votes)
    castVote(g, {
      roundId: g.round?.id ?? "",
      userId: voter,
      index: g.round?.order.indexOf(author) ?? -1,
    });
}

test("most votes wins a point; a tie gives each tied player one", () => {
  const g = started();
  voted(g, [
    ["u1", "u2"],
    ["u2", "u1"],
  ]);

  expect(closeVoting(g, T0).winners.toSorted()).toEqual(["u1", "u2"]);
  expect([...g.points]).toEqual([
    ["u2", 1],
    ["u1", 1],
  ]);
  expect(g.phase).toBe("reveal");
  expect(g.deadline).toBe(T0 + 8_000);
});

test("no votes at all, no point", () => {
  const g = started();
  voted(g, []);

  expect(closeVoting(g, T0).winners).toEqual([]);
  expect(g.points.size).toBe(0);
});

test("after the reveal hands are back to 7 and the next round opens", () => {
  const g = started();
  voted(g, [["u1", "u2"]]);
  closeVoting(g, T0);
  finishRound(g, T0, Math.random);

  expect(g.players.map((p) => p.hand.length)).toEqual([7, 7, 7]);
  expect(g.rounds).toBe(2);
  expect(g.phase).toBe("playing");
});

test("a player with neither a play nor a vote for 2 rounds is dropped", () => {
  const g = started();

  for (let round = 0; round < 2; round++) {
    for (const id of ["u1", "u2"])
      playCard(g, { roundId: g.round?.id ?? "", userId: id, index: 0 });

    openVoting(g, T0, Math.random);
    closeVoting(g, T0);
    finishRound(g, T0, Math.random);
  }

  expect(g.players.map((p) => p.userId)).toEqual(["u1", "u2"]);
  expect(g.phase).toBe("over");
  expect(g.endReason).toBe("players");
});

test("ends: target reached, under 3 players, 3 empty rounds", () => {
  const g = started({ target: 2 });

  expect(endCheck(g)).toBeNull();

  g.points.set("u1", 2);
  expect(endCheck(g)).toBe("target");

  g.points.clear();
  g.emptyRounds = 3;
  expect(endCheck(g)).toBe("empty");
});
