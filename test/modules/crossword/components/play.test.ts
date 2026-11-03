import { expect, test } from "bun:test";
import { MessageFlags } from "discord.js";
import { fakeClick, fakeModal } from "../../../core/fake-interaction.ts";
import { viewText } from "../view-text.ts";
import { answerHandler } from "../../../../src/modules/crossword/components/answer.ts";
import { pickHandler } from "../../../../src/modules/crossword/components/pick.ts";
import { revealHandler } from "../../../../src/modules/crossword/components/reveal.ts";
import { col, row } from "../play/fixtures.ts";
import { DATE, keyOf, setup, stored } from "./setup.ts";

const pick = pickHandler;
const answer = answerHandler;
const reveal = revealHandler;
const FINISHED = { finishedAt: 5, solved: true, points: 100, streak: 1 };

/** The prefilled value of a modal's input, if any. */
const inputOf = (modal: unknown) => ({
  value: /"value":"([A-Z.]+)"/.exec(JSON.stringify(modal))?.[1],
});

test("the select opens the answer modal for the chosen clue, empty", async () => {
  const { ctx } = setup();
  const { i, calls } = fakeClick("u", { values: [keyOf(row(1))] });
  await pick.handle(i, [DATE, "1"], ctx);

  expect(calls.modal).toHaveLength(1);
  expect(calls.modal[0]?.custom_id).toBe(`crossword:answer:${DATE}:1:${keyOf(row(1))}`);
  expect(inputOf(calls.modal[0])?.value).toBeUndefined();
  expect(calls.update).toHaveLength(0);
});

test("a filled clue opens prefilled with its letters, uppercase; a finished game re-renders", async () => {
  const filled = setup({ cells: `cRate${".".repeat(20)}` });
  const a = fakeClick("u", { values: [keyOf(row(0))] });
  await pick.handle(a.i, [DATE, "1"], filled.ctx);
  expect(inputOf(a.calls.modal[0])?.value).toBe("CRATE");

  const partial = fakeClick("u", { values: [keyOf(col(0))] });
  await pick.handle(partial.i, [DATE, "1"], filled.ctx);
  expect(inputOf(partial.calls.modal[0])?.value).toBeUndefined();

  const done = setup(FINISHED);
  const b = fakeClick("u", { values: [keyOf(row(1))] });
  await pick.handle(b.i, [DATE, "1"], done.ctx);
  expect(b.calls.modal).toHaveLength(0);
  expect(b.calls.update).toHaveLength(1);
});

test("a typed word fills the board with the grid image", async () => {
  const { ctx, repo } = setup();
  const { i, calls } = fakeModal("u", "CRANE");
  await answer.handle(i, [DATE, "1", keyOf(row(0))], ctx);

  expect(stored(repo)?.cells.startsWith("crane")).toBe(true);
  expect(viewText(calls.update[0])).toContain("Words 1/10");
  expect(calls.update[0]?.files?.map((f) => f.name)).toEqual(["crossword.png"]);
  expect(calls.update[0]?.attachments).toEqual([]);
  expect(calls.update[0]?.allowedMentions).toEqual({ parse: [] });
});

test("a wrong word goes in unjudged and costs nothing", async () => {
  const { ctx, repo } = setup();
  const { i, calls } = fakeModal("u", "olive");
  await answer.handle(i, [DATE, "1", keyOf(row(0))], ctx);

  expect(stored(repo)).toMatchObject({ wrong: 0, lastLine: null });
  expect(stored(repo)?.cells.startsWith("olive")).toBe(true);
  expect(viewText(calls.update[0])).toContain("100 pts");
  expect(viewText(calls.update[0])).not.toContain("❌");
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

test("a filled clue can be typed again; revealed letters stay and say so", async () => {
  const { ctx, repo } = setup({ cells: `cRane${".".repeat(20)}` });
  const { i, calls } = fakeModal("u", "olive");
  await answer.handle(i, [DATE, "1", keyOf(row(0))], ctx);

  expect(stored(repo)?.cells.slice(0, 5)).toBe("oRive");
  expect(viewText(calls.update[0])).toContain("🔎 Kept the revealed letters in 1 Across");
});

test("a submit not from a message answers ephemerally with the board", async () => {
  const { ctx } = setup();
  const { i, calls } = fakeModal("u", "crane", { notFromMessage: true });
  await answer.handle(i, [DATE, "1", keyOf(row(0))], ctx);

  expect(viewText(calls.reply[0])).toContain("Words 1/10");
  expect(calls.reply[0]?.files).toHaveLength(1);
  expect(calls.reply[0]?.flags).toEqual([MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]);
});

test("a down answer overwrites the cells it shares with an across answer", async () => {
  const { ctx, repo } = setup();
  await answer.handle(fakeModal("u", "zzzzz").i, [DATE, "1", keyOf(row(0))], ctx);
  await answer.handle(fakeModal("u", "coups").i, [DATE, "1", keyOf(col(0))], ctx);

  const cells = stored(repo)!.cells;
  expect([0, 5, 10, 15, 20].map((c) => cells[c]).join("")).toBe("coups");
  expect(cells.slice(0, 5)).toBe("czzzz");
});

test("Reveal letter costs 10 and fills one cell, uppercase", async () => {
  const { ctx, repo } = setup();
  const { i, calls } = fakeClick("u");
  await reveal.handle(i, [DATE, "1"], ctx);

  const game = stored(repo)!;
  expect(game.reveals).toBe(1);
  expect(game.cells.replaceAll(".", "")).toMatch(/^[A-Z]$/);
  expect(viewText(calls.update[0])).toContain("90 pts");
  expect(viewText(calls.update[0])).toContain("🔎 Revealed a letter");
});
