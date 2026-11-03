import { expect, test } from "bun:test";
import { fakeClick, fakeModal } from "../../../core/fake-interaction.ts";
import { answerHandler } from "../../../../src/modules/crossword/components/answer.ts";
import { pickHandler } from "../../../../src/modules/crossword/components/pick.ts";
import { revealHandler } from "../../../../src/modules/crossword/components/reveal.ts";
import { col, row } from "../play/fixtures.ts";
import { DATE, keyOf, setup, stored } from "./setup.ts";

const pick = pickHandler;
const answer = answerHandler;
const reveal = revealHandler;
const FINISHED = { finishedAt: 5, solved: true, points: 100, streak: 1 };

test("the select opens the answer modal for the chosen clue", async () => {
  const { ctx } = setup();
  const { i, calls } = fakeClick("u", { values: [keyOf(row(1))] });
  await pick.handle(i, [DATE, "1"], ctx);

  expect(calls.modal).toHaveLength(1);
  expect(calls.modal[0]?.custom_id).toBe(`crossword:answer:${DATE}:1:${keyOf(row(1))}`);
  expect(calls.update).toHaveLength(0);
});

test("a solved clue or a finished game re-renders instead of opening the modal", async () => {
  const solved = setup({ cells: `crane${".".repeat(20)}` });
  const a = fakeClick("u", { values: [keyOf(row(0))] });
  await pick.handle(a.i, [DATE, "1"], solved.ctx);
  expect(a.calls.modal).toHaveLength(0);
  expect(a.calls.update[0]?.content).toContain("Crossword #1");

  const done = setup(FINISHED);
  const b = fakeClick("u", { values: [keyOf(row(1))] });
  await pick.handle(b.i, [DATE, "1"], done.ctx);
  expect(b.calls.modal).toHaveLength(0);
  expect(b.calls.update).toHaveLength(1);
});

test("a right word fills the board", async () => {
  const { ctx, repo } = setup();
  const { i, calls } = fakeModal("u", "CRANE");
  await answer.handle(i, [DATE, "1", keyOf(row(0))], ctx);

  expect(stored(repo)?.cells.startsWith("crane")).toBe(true);
  expect(calls.update[0]?.content).toContain("Words 1/10");
  expect(calls.update[0]?.allowedMentions).toEqual({ parse: [] });
});

test("a wrong word costs 5 and shows the miss", async () => {
  const { ctx, repo } = setup();
  const { i, calls } = fakeModal("u", "olive");
  await answer.handle(i, [DATE, "1", keyOf(row(0))], ctx);

  expect(stored(repo)?.wrong).toBe(1);
  expect(calls.update[0]?.content).toContain("95 pts");
  expect(calls.update[0]?.content).toContain("❌ 1 Across: not OLIVE");
});

test("a bad length is an ephemeral reply and costs nothing", async () => {
  const { ctx, repo } = setup();
  const { i, calls } = fakeModal("u", "cran");
  await answer.handle(i, [DATE, "1", keyOf(row(0))], ctx);

  expect(calls.reply[0]?.content).toBe("Answers are 5 letters, A–Z — no points lost.");
  expect(calls.reply[0]?.flags).toBeDefined();
  expect(stored(repo)?.wrong).toBe(0);
  expect(calls.update).toHaveLength(0);
});

test("an answer to a solved clue changes nothing", async () => {
  const { ctx, repo } = setup({ cells: `crane${".".repeat(20)}` });
  const { i, calls } = fakeModal("u", "olive");
  await answer.handle(i, [DATE, "1", keyOf(row(0))], ctx);

  expect(stored(repo)?.wrong).toBe(0);
  expect(calls.update).toHaveLength(1);
});

test("a submit not from a message answers ephemerally with the board", async () => {
  const { ctx } = setup();
  const { i, calls } = fakeModal("u", "crane", { notFromMessage: true });
  await answer.handle(i, [DATE, "1", keyOf(row(0))], ctx);

  expect(calls.reply[0]?.content).toContain("Words 1/10");
  expect(calls.reply[0]?.flags).toBeDefined();
});

test("a down answer fills the cells it shares with an across answer", async () => {
  const { ctx, repo } = setup();
  await answer.handle(fakeModal("u", "crane").i, [DATE, "1", keyOf(row(0))], ctx);
  await answer.handle(fakeModal("u", "coups").i, [DATE, "1", keyOf(col(0))], ctx);

  const cells = stored(repo)!.cells;
  expect([0, 5, 10, 15, 20].map((c) => cells[c]).join("")).toBe("coups");
  expect(cells.slice(0, 5)).toBe("crane");
});

test("Reveal letter costs 10 and fills one cell", async () => {
  const { ctx, repo } = setup();
  const { i, calls } = fakeClick("u");
  await reveal.handle(i, [DATE, "1"], ctx);

  const game = stored(repo)!;
  expect(game.reveals).toBe(1);
  expect(game.cells.replaceAll(".", "")).toHaveLength(1);
  expect(calls.update[0]?.content).toContain("90 pts");
  expect(calls.update[0]?.content).toContain("🔎 Revealed a letter");
});
