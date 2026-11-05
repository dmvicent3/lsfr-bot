import { expect, test } from "bun:test";
import { seedFor } from "../../../../src/core/seed.ts";
import { fakeClick, fakeModal } from "../../../core/fake-interaction.ts";
import { viewText } from "../view-text.ts";
import { answerHandler } from "../../../../src/modules/crossword/components/answer.ts";
import { checkHandler } from "../../../../src/modules/crossword/components/check.ts";
import { crosswordComponents } from "../../../../src/modules/crossword/components/components.ts";
import { newHandler } from "../../../../src/modules/crossword/components/new.ts";
import { pickHandler } from "../../../../src/modules/crossword/components/pick.ts";
import { revealHandler } from "../../../../src/modules/crossword/components/reveal.ts";
import { crosswordModals } from "../../../../src/modules/crossword/modals.ts";
import { row } from "../play/fixtures.ts";
import { DATE, STALE, keyOf, missing, setup, stored } from "./setup.ts";

const answer = answerHandler;
const slot = keyOf(row(0));

test("a new practice puzzle replaces the row, deferring first", async () => {
  const { ctx, repo } = setup({}, { startedAt: 7 });
  const { i, calls } = fakeClick("u");
  await newHandler(null, seedFor("a", "b")).handle(i, ["5"], ctx);

  expect(calls.order).toEqual(["deferUpdate", "editReply"]);
  expect(viewText(calls.editReply[0])).toContain("Practice crossword 5×5");
  expect(calls.editReply[0]?.files).toHaveLength(1);
  expect(repo.practice.get("g", "u")?.startedAt).not.toBe(7);
});

test("New outside a server or with a bad size is refused before deferring", async () => {
  const { ctx } = setup();
  const a = fakeClick("u", { noGuild: true });
  await newHandler(null, Math.random).handle(a.i, ["5"], ctx);
  expect(a.calls.reply[0]?.content).toBe("Crossword works in a server.");

  const b = fakeClick("u");
  await newHandler(null, Math.random).handle(b.i, ["9"], ctx);
  expect(b.calls.reply[0]?.content).toBe(STALE);
  expect(b.calls.order).toEqual([]);
});

test("a modal opened before New is stale: board when it can update, else the stale reply", async () => {
  const { ctx } = setup(null, { startedAt: 7 });
  await newHandler(null, seedFor("a", "b")).handle(fakeClick("u").i, ["5"], ctx);
  const id = ["practice", (7).toString(36), slot];

  const a = fakeModal("u", "crane");
  await answer.handle(a.i, id, ctx);
  expect(viewText(a.calls.update[0])).toContain("Practice crossword");

  const b = fakeModal("u", "crane", { notFromMessage: true });
  await answer.handle(b.i, id, ctx);
  expect(b.calls.reply[0]?.content).toBe(STALE);
});

test("a click with an old stamp or without a game is stale", async () => {
  const old = setup({ startedAt: 100 });
  const a = fakeClick("u");
  await revealHandler.handle(a.i, [DATE, "1"], old.ctx);
  expect(a.calls.update).toHaveLength(1);
  expect(stored(old.repo)?.reveals).toBe(0);

  const none = setup(null);
  const b = fakeClick("u");
  await pickHandler.handle(b.i, [DATE, "1"], none.ctx);
  expect(b.calls.reply[0]?.content).toBe(STALE);

  const other = fakeClick("u");
  await revealHandler.handle(other.i, ["2026-11-09", "1"], none.ctx);
  expect(other.calls.reply[0]?.content).toBe(STALE);
});

test("the factories list every handler id", () => {
  expect(crosswordComponents(null, Math.random).map((h) => h.id)).toEqual([
    "crossword:pick",
    "crossword:clues",
    "crossword:cell",
    "crossword:check",
    "crossword:reveal",
    "crossword:giveup",
    "crossword:new",
    "crossword:page",
  ]);
  expect(crosswordModals().map((h) => h.id)).toEqual(["crossword:answer", "crossword:cellword"]);
});

test("a non-select click on the pick id still gets an answer", async () => {
  const { ctx } = setup();
  const a = fakeClick("u", { notSelect: true });
  await pickHandler.handle(a.i, [DATE, "1"], ctx);

  expect(a.calls.reply[0]?.content).toBe(STALE);
});

test("a daily modal and Check after midnight still apply to that date's stored game", async () => {
  const { ctx, repo } = setup({ cells: missing(0), startedAt: 1 });
  const realNow = Date.now;
  Date.now = () => Date.UTC(2026, 10, 5, 0, 30);

  try {
    const a = fakeModal("u", "crane");
    await answer.handle(a.i, [DATE, "1", slot], ctx);
    const b = fakeClick("u");
    await checkHandler.handle(b.i, [DATE, "1"], ctx);

    expect(stored(repo)?.solved).toBe(true);
    expect(a.calls.update).toHaveLength(1);
    expect(viewText(b.calls.update[0])).toContain("Next crossword in 23h");
  } finally {
    Date.now = realNow;
  }
});
