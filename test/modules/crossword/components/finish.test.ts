import { expect, test } from "bun:test";
import { fakeClick, fakeModal } from "../../../core/fake-interaction.ts";
import { answerHandler } from "../../../../src/modules/crossword/components/answer.ts";
import { giveUpHandler } from "../../../../src/modules/crossword/components/give-up.ts";
import { revealHandler } from "../../../../src/modules/crossword/components/reveal.ts";
import { row } from "../play/fixtures.ts";
import { DATE, keyOf, missing, setup, stored } from "./setup.ts";

const answer = answerHandler;
const reveal = revealHandler;
const giveUp = giveUpHandler;

test("the last cell by word finishes, scores and announces once", async () => {
  const { ctx, repo } = setup({ cells: missing(0), wrong: 1 });
  const a = fakeModal("u", "crane");
  await answer.handle(a.i, [DATE, "1", keyOf(row(0))], ctx);

  const game = stored(repo)!;
  expect(game.solved).toBe(true);
  expect(game.points).toBe(95);
  expect(a.calls.update[0]?.content).toContain("Next crossword in");
  expect(a.calls.send).toHaveLength(1);
  expect(a.calls.send[0]?.content).toStartWith(
    "<@u> solved Crossword #1 — 95 pts · 1 mistakes · 0 reveals · ",
  );

  const again = fakeModal("u", "crane");
  await answer.handle(again.i, [DATE, "1", keyOf(row(0))], ctx);
  expect(again.calls.send).toHaveLength(0);
});

test("the last cell by reveal finishes and announces once", async () => {
  const { ctx, repo } = setup({ cells: missing(12) });
  const a = fakeClick("u");
  await reveal.handle(a.i, [DATE, "1"], ctx);

  expect(stored(repo)?.finishedAt).not.toBeNull();
  expect(stored(repo)?.points).toBe(90);
  expect(a.calls.send).toHaveLength(1);
  expect(a.calls.send[0]?.content).toStartWith(
    "<@u> solved Crossword #1 — 90 pts · 0 mistakes · 1 reveals",
  );

  const again = fakeClick("u");
  await reveal.handle(again.i, [DATE, "1"], ctx);
  expect(again.calls.send).toHaveLength(0);
  expect(stored(repo)?.reveals).toBe(1);
});

test("Give up scores 0, announces once and ignores a second click", async () => {
  const { ctx, repo } = setup({ cells: missing(0, 1) });
  const a = fakeClick("u");
  await giveUp.handle(a.i, [DATE, "1"], ctx);

  expect(stored(repo)).toMatchObject({ solved: false, points: 0 });
  expect(a.calls.update[0]?.content).toContain("Gave up");
  expect(a.calls.send.map((m) => m.content)).toEqual(["<@u> gave up on Crossword #1"]);

  const again = fakeClick("u");
  await giveUp.handle(again.i, [DATE, "1"], ctx);
  expect(again.calls.send).toHaveLength(0);
  expect(again.calls.update).toHaveLength(1);
});

test("a failed announcement does not undo the finish", async () => {
  const { ctx, repo } = setup({ cells: missing(12) });
  const a = fakeClick("u", { failSend: true });
  await reveal.handle(a.i, [DATE, "1"], ctx);

  expect(stored(repo)?.solved).toBe(true);
  expect(a.calls.update).toHaveLength(1);
});

test("a practice crossword finishes without announcing", async () => {
  const { ctx, repo } = setup(null, { cells: missing(12) });
  const a = fakeClick("u");
  await reveal.handle(a.i, ["practice", "1"], ctx);

  expect(repo.practice.get("g", "u")?.finishedAt).not.toBeNull();
  expect(a.calls.send).toHaveLength(0);
  expect(a.calls.update[0]?.content).toContain("Practice crossword");
});

test("a click on a finished board re-renders it and changes nothing", async () => {
  const done = { cells: missing(), finishedAt: 5, solved: true, points: 100, streak: 1 };
  const { ctx, repo } = setup(done);
  const a = fakeClick("u");
  await reveal.handle(a.i, [DATE, "1"], ctx);
  const b = fakeClick("u");
  await giveUp.handle(b.i, [DATE, "1"], ctx);

  expect(stored(repo)).toMatchObject({ reveals: 0, solved: true, points: 100 });
  expect(a.calls.update).toHaveLength(1);
  expect(b.calls.update).toHaveLength(1);
  expect(a.calls.send.length + b.calls.send.length).toBe(0);
});
