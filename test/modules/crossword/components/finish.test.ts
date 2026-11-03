import { expect, test } from "bun:test";
import { fakeClick, fakeModal } from "../../../core/fake-interaction.ts";
import { viewText } from "../view-text.ts";
import { answerHandler } from "../../../../src/modules/crossword/components/answer.ts";
import { checkHandler } from "../../../../src/modules/crossword/components/check.ts";
import { giveUpHandler } from "../../../../src/modules/crossword/components/give-up.ts";
import { revealHandler } from "../../../../src/modules/crossword/components/reveal.ts";
import { row } from "../play/fixtures.ts";
import { DATE, keyOf, missing, setup, stored } from "./setup.ts";

const answer = answerHandler;
const check = checkHandler;
const reveal = revealHandler;
const giveUp = giveUpHandler;

/** The solved square with its first cell typed wrong. */
const WRONG = `z${missing().slice(1)}`;

test("the last word fills the grid but does not finish", async () => {
  const { ctx, repo } = setup({ cells: missing(0) });
  const a = fakeModal("u", "crane");
  await answer.handle(a.i, [DATE, "1", keyOf(row(0))], ctx);

  expect(stored(repo)).toMatchObject({ finishedAt: null, cells: missing() });
  expect(a.calls.send).toHaveLength(0);
});

test("Check on a correct grid finishes, scores and announces once", async () => {
  const { ctx, repo } = setup({ cells: missing(), wrong: 1 });
  const a = fakeClick("u");
  await check.handle(a.i, [DATE, "1"], ctx);

  expect(stored(repo)).toMatchObject({ solved: true, points: 90 });
  expect(viewText(a.calls.update[0])).toContain("Next crossword in");
  expect(a.calls.send).toHaveLength(1);
  expect(a.calls.send[0]?.content).toStartWith(
    "<@u> solved Crossword #2 — 90 pts · 1 wrong checks · 0 reveals · ",
  );

  const again = fakeClick("u");
  await check.handle(again.i, [DATE, "1"], ctx);
  expect(again.calls.send).toHaveLength(0);
  expect(again.calls.update).toHaveLength(1);
});

test("Check on a wrong grid costs 10 and does not say which", async () => {
  const { ctx, repo } = setup({ cells: WRONG });
  const a = fakeClick("u");
  await check.handle(a.i, [DATE, "1"], ctx);

  expect(stored(repo)).toMatchObject({ wrong: 1, finishedAt: null });
  expect(viewText(a.calls.update[0])).toContain("90 pts");
  expect(viewText(a.calls.update[0])).toEndWith("❌ Not quite — some letters are wrong (−10)");
  expect(a.calls.send).toHaveLength(0);
});

test("a practice wrong check shows no cost", async () => {
  const { ctx, repo } = setup(null, { cells: WRONG });
  const a = fakeClick("u");
  await check.handle(a.i, ["practice", "1"], ctx);

  expect(repo.practice.get("g", "u")?.wrong).toBe(1);
  expect(viewText(a.calls.update[0])).toEndWith("❌ Not quite — some letters are wrong");
});

test("Check on a grid that isn't full refreshes the board and changes nothing", async () => {
  const { ctx, repo } = setup({ cells: missing(3) });
  const a = fakeClick("u");
  await check.handle(a.i, [DATE, "1"], ctx);

  expect(stored(repo)).toMatchObject({ wrong: 0, finishedAt: null, lastLine: null });
  expect(a.calls.update).toHaveLength(1);
});

test("the last cell by reveal finishes and announces once", async () => {
  const { ctx, repo } = setup({ cells: missing(12) });
  const a = fakeClick("u");
  await reveal.handle(a.i, [DATE, "1"], ctx);

  expect(stored(repo)?.finishedAt).not.toBeNull();
  expect(stored(repo)?.points).toBe(90);
  expect(a.calls.send).toHaveLength(1);
  expect(a.calls.send[0]?.content).toStartWith(
    "<@u> solved Crossword #2 — 90 pts · 0 wrong checks · 1 reveals",
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
  expect(viewText(a.calls.update[0])).toContain("Gave up");
  expect(a.calls.update[0]?.files).toHaveLength(1);
  expect(a.calls.send.map((m) => m.content)).toEqual(["<@u> gave up on Crossword #2"]);

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
  const { ctx, repo } = setup(null, { cells: missing() });
  const a = fakeClick("u");
  await check.handle(a.i, ["practice", "1"], ctx);

  expect(repo.practice.get("g", "u")?.finishedAt).not.toBeNull();
  expect(a.calls.send).toHaveLength(0);
  expect(viewText(a.calls.update[0])).toContain("Practice crossword");
  expect(viewText(a.calls.update[0])).toContain("Solved!");
});

test("a click on a finished board re-renders it and changes nothing", async () => {
  const done = { cells: missing(), finishedAt: 5, solved: true, points: 100, streak: 1 };
  const { ctx, repo } = setup(done);
  const a = fakeClick("u");
  await reveal.handle(a.i, [DATE, "1"], ctx);
  const b = fakeClick("u");
  await giveUp.handle(b.i, [DATE, "1"], ctx);
  const c = fakeClick("u");
  await check.handle(c.i, [DATE, "1"], ctx);

  expect(stored(repo)).toMatchObject({ reveals: 0, wrong: 0, solved: true, points: 100 });
  expect(a.calls.update).toHaveLength(1);
  expect(b.calls.update).toHaveLength(1);
  expect(c.calls.update).toHaveLength(1);
  expect(a.calls.send.length + b.calls.send.length + c.calls.send.length).toBe(0);
});

test("a failed board edit still announces the finish once", async () => {
  const { ctx, repo } = setup({ cells: missing(12) });
  const a = fakeClick("u", { failUpdate: true });
  await reveal.handle(a.i, [DATE, "1"], ctx);

  expect(stored(repo)?.solved).toBe(true);
  expect(a.calls.send).toHaveLength(1);
});
