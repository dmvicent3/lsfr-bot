import { expect, test } from "bun:test";
import { openVoting, playCard } from "../../../../src/modules/cards/game/play.ts";
import { closeVoting } from "../../../../src/modules/cards/game/tally.ts";
import type { Game } from "../../../../src/modules/cards/game/types.ts";
import { castVote } from "../../../../src/modules/cards/game/vote.ts";
import { handMessage } from "../../../../src/modules/cards/render/hand.ts";
import { lobbyMessage } from "../../../../src/modules/cards/render/lobby.ts";
import { revealMessage } from "../../../../src/modules/cards/render/reveal.ts";
import { playingMessage, votingMessage } from "../../../../src/modules/cards/render/round.ts";
import type { Outgoing } from "../../../../src/modules/trivia/session/types.ts";
import { T0, cardAt, game, started } from "../fixtures.ts";

const text = (m: Outgoing): string => `${m.content ?? ""}${JSON.stringify(m.embeds ?? [])}`;

const ids = (m: Outgoing): string[] =>
  JSON.parse(JSON.stringify(m.components ?? [])).flatMap(
    (row: { components: { custom_id: string }[] }) => row.components.map((c) => c.custom_id),
  );

const play = (g: Game, id: string) =>
  playCard(g, { roundId: g.round?.id ?? "", userId: id, cardId: cardAt(g, id) });

test("the lobby lists players and has join, leave and start", () => {
  const m = lobbyMessage(game());

  expect(text(m)).toContain("Ana");
  expect(ids(m)).toEqual(["cards:join", "cards:leave", "cards:start"]);
});

test("the playing post shows who has played, never what", () => {
  const g = started();
  const card = g.players[0]?.hand[0]?.text ?? "";
  play(g, "u1");
  const m = playingMessage(g);

  expect(text(m)).toContain("✅ Ana");
  expect(text(m)).not.toContain(card);
  expect(ids(m)).toEqual(["cards:hand", "cards:join", "cards:leave"]);
});

test("the voting post fills the prompt with each answer, numbered, in reveal order", () => {
  const g = started();

  for (const id of ["u1", "u2", "u3"]) play(g, id);

  openVoting(g, T0, Math.random);
  const m = votingMessage(g);
  const first = g.round?.plays.get(g.round.order[0] ?? "")?.[0]?.text ?? "";

  expect(text(m)).toContain(`**1.** ${g.round?.prompt.text.split("___")[0]}**${first}**`);
  expect(ids(m)).toEqual(["1-1", "1-1", "1-1"].map((r, i) => `cards:vote:${r}:${i}`));
});

test("the reveal names each author with their votes and the winner", () => {
  const g = started();

  for (const id of ["u1", "u2", "u3"]) play(g, id);

  openVoting(g, T0, Math.random);
  const index = g.round?.order.indexOf("u2") ?? -1;
  castVote(g, { roundId: "1-1", userId: "u1", index });
  closeVoting(g, T0);

  expect(text(revealMessage(g))).toContain("U2 — 1 vote");
  expect(text(revealMessage(g))).toContain("🏆 U2 wins the round");
});

test("the hand shows the prompt and one button per card", () => {
  const g = started();
  const hand = handMessage(g, "u1");

  expect(hand.content).toContain(g.round?.prompt.text.split("___")[0] ?? "?");
  expect(ids(hand)).toEqual((g.players[0]?.hand ?? []).map((c) => `cards:play:1-1:${c.id}`));
  expect(handMessage(g, "u9").content).toBe("You're not in this game. Press Join.");
});
