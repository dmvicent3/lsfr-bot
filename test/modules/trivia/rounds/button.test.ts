import { expect, test } from "bun:test";
import {
  buttonAwards,
  buttonPick,
  buttonStart,
  buttonTick,
} from "../../../../src/modules/trivia/rounds/button.ts";
import { question } from "../fixtures.ts";

const T0 = 1_000_000;
const q = question(9, {
  kind: "choice",
  difficulty: "medium",
  answer: "Mars",
  wrong: ["Venus", "Pluto", "Moon"],
});
const start = (expected: string[] = []) =>
  buttonStart(q, { id: "b1", now: T0, random: Math.random, expected });
const pick = (userId: string, index: number, ms: number) => ({ userId, index, at: T0 + ms });

test("the shuffled options hold every answer and `right` points at the answer", () => {
  const r = start();

  expect(r.options.toSorted()).toEqual(["Mars", "Moon", "Pluto", "Venus"]);
  expect(r.options[r.right]).toBe("Mars");
});

test("true/false keeps True before False", () => {
  const tf = question(10, { kind: "choice", answer: "False", wrong: ["True"] });
  const r = buttonStart(tf, { id: "b2", now: T0, random: () => 0, expected: [] });

  expect(r.options).toEqual(["True", "False"]);
  expect(r.right).toBe(1);
});

test("a pick locks in once; a second pick is refused and changes nothing", () => {
  const first = buttonPick(start(), pick("a", 0, 1_000));
  const second = buttonPick(first.round, pick("a", 1, 2_000));

  expect(first.result).toBe("locked");
  expect(second.result).toBe("already");
  expect(second.round.picks).toEqual([pick("a", 0, 1_000)]);
});

test("the round closes early once every expected player has picked", () => {
  const one = buttonPick(start(["a", "b"]), pick("a", 0, 1_000));
  const two = buttonPick(one.round, pick("b", 1, 4_000));

  expect(one.round.closedAt).toBeNull();
  expect(two.round.closedAt).toBe(T0 + 4_000);
});

test("with no one expected it stays open until 20 s", () => {
  const r = buttonPick(start(), pick("a", 0, 1_000)).round;

  expect(r.closedAt).toBeNull();
  expect(buttonTick(r, T0 + 19_999).closedAt).toBeNull();
  expect(buttonTick(r, T0 + 20_000).closedAt).toBe(T0 + 20_000);
});

test("expected players who never show up don't hold it past 20 s", () => {
  expect(buttonTick(start(["gone"]), T0 + 20_000).closedAt).toBe(T0 + 20_000);
});

test("picks after the close are refused", () => {
  const closed = buttonTick(start(), T0 + 20_000);

  expect(buttonPick(closed, pick("a", 0, 21_000)).result).toBe("closed");
});

test("every right picker scores by speed, fastest first", () => {
  let r = start();
  const right = r.right;
  const wrong = (right + 1) % 4;
  r = buttonPick(r, pick("slow", right, 9_800)).round;
  r = buttonPick(r, pick("fast", right, 3_100)).round;
  r = buttonPick(r, pick("miss", wrong, 1_000)).round;

  expect(buttonAwards(r)).toEqual([
    { userId: "fast", points: 14, ms: 3_100 },
    { userId: "slow", points: 11, ms: 9_800 },
  ]);
});

test("a pick at 20 s is refused even before the tick closes the round", () => {
  expect(buttonPick(start(), pick("a", 0, 20_000)).result).toBe("closed");
});
