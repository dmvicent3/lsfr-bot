import { expect, test } from "bun:test";
import { typedAnswer, typedStart, typedTick } from "../../../../src/modules/trivia/rounds/typed.ts";
import { question } from "../fixtures.ts";

const T0 = 1_000_000;
const start = () => typedStart(question(7, { answer: "permission" }), "r1", T0, () => 0.5);
const at = (ms: number) => T0 + ms;

test("hints come at 15 s and 30 s", () => {
  expect(typedTick(start(), at(14_999)).level).toBe(0);
  expect(typedTick(start(), at(15_000)).level).toBe(1);
  expect(typedTick(start(), at(30_000)).level).toBe(2);
});

test("45 s with no answer closes the round without an award", () => {
  const r = typedTick(start(), at(45_000));

  expect(r.closedAt).toBe(at(45_000));
  expect(r.award).toBeNull();
});

test("a right answer after hint 2 wins half points and closes", () => {
  const r = typedAnswer(typedTick(start(), at(15_000)), {
    userId: "tyh",
    text: "Permission!",
    at: at(17_550),
  });

  expect(r.award).toEqual({ userId: "tyh", points: 5, ms: 17_550 });
  expect(r.closedAt).toBe(at(17_550));
});

test("a wrong answer changes nothing", () => {
  const r = start();

  expect(typedAnswer(r, { userId: "x", text: "permit", at: at(1_000) })).toBe(r);
});

test("answers and ticks after the close change nothing", () => {
  const closed = typedTick(start(), at(45_000));

  expect(typedAnswer(closed, { userId: "x", text: "permission", at: at(45_000) })).toBe(closed);
  expect(typedTick(closed, at(60_000))).toBe(closed);
});

test("only the first right answer wins", () => {
  const won = typedAnswer(start(), { userId: "a", text: "permission", at: at(5_000) });
  const again = typedAnswer(won, { userId: "b", text: "permission", at: at(5_001) });

  expect(again.award?.userId).toBe("a");
});

test("an answer is scored at its own time, even before the tick catches up", () => {
  const r = typedAnswer(start(), { userId: "a", text: "permission", at: at(16_000) });

  expect(r.award?.points).toBe(5);
});

test("an answer at or after 45 s is too late, even before the tick", () => {
  const r = typedAnswer(start(), { userId: "a", text: "permission", at: at(45_000) });

  expect(r.award).toBeNull();
});

test("an alias wins like the answer", () => {
  const q = question(8, { answer: "Lionel Messi", aliases: ["Messi"] });
  const r = typedAnswer(
    typedStart(q, "r", T0, () => 0),
    { userId: "a", text: "messi", at: at(1_000) },
  );

  expect(r.award?.userId).toBe("a");
});

test("without aliases only the answer wins", () => {
  const q = question(8, { answer: "Lionel Messi" });
  const r = typedAnswer(
    typedStart(q, "r", T0, () => 0),
    { userId: "a", text: "messi", at: at(1_000) },
  );

  expect(r.award).toBeNull();
});
