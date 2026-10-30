import { expect, test } from "bun:test";
import { join, leave, startGame } from "../../../../src/modules/cards/game/lobby.ts";
import { T0, game, joinAll, started } from "../fixtures.ts";

test("a new game is a lobby with the starter in it, closing in 5 minutes", () => {
  const g = game();

  expect(g.phase).toBe("lobby");
  expect(g.players.map((p) => p.userId)).toEqual(["u1"]);
  expect(g.deadline).toBe(T0 + 5 * 60_000);
});

test("only the starter can start, and only with 3 players", () => {
  const g = game();
  joinAll(g, ["u2"]);

  expect(startGame(g, "u2", T0, Math.random)).toBe("not-starter");
  expect(startGame(g, "u1", T0, Math.random)).toBe("too-few");

  joinAll(g, ["u3"]);
  expect(startGame(g, "u1", T0, Math.random)).toBe("started");
  expect(startGame(g, "u1", T0, Math.random)).toBe("not-lobby");
});

test("starting deals 7 different cards each and opens round 1", () => {
  const g = started();
  const ids = g.players.flatMap((p) => p.hand.map((c) => c.id));

  expect(g.players.every((p) => p.hand.length === 7)).toBe(true);
  expect(new Set(ids).size).toBe(21);
  expect(g.phase).toBe("playing");
  expect(g.rounds).toBe(1);
  expect(g.round?.id).toBe("1-1");
  expect(g.deadline).toBe(T0 + 60_000);
});

test("joining twice is refused; a mid-game joiner gets a hand and plays from the next round", () => {
  const g = started();

  expect(join(g, { userId: "u2", name: "Bo" }, Math.random)).toBe("already");
  expect(join(g, { userId: "u4", name: "Di" }, Math.random)).toBe("joined");
  expect(g.players.find((p) => p.userId === "u4")).toMatchObject({ from: 2 });
  expect(g.players.find((p) => p.userId === "u4")?.hand).toHaveLength(7);
});

test("leaving puts the hand on the discard pile", () => {
  const g = started();

  expect(leave(g, "u3")).toBe("left");
  expect(leave(g, "u3")).toBe("not-in");
  expect(g.players).toHaveLength(2);
  expect(g.answers.discard).toHaveLength(7);
});
