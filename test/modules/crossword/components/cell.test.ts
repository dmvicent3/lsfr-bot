import { expect, test } from "bun:test";
import { fakeClick, fakeModal } from "../../../core/fake-interaction.ts";
import { viewText } from "../view-text.ts";
import { cellHandler } from "../../../../src/modules/crossword/components/cell.ts";
import { cellWordHandler } from "../../../../src/modules/crossword/components/cell-word.ts";
import { buildRouter } from "../../../../src/core/router.ts";
import { crosswordModule } from "../../../../src/modules/crossword/index.ts";
import { DATE, STALE, setup, stored } from "./setup.ts";

const FINISHED = { finishedAt: 5, solved: true, points: 100, streak: 1 };
const column = (cells: string, c: number) => [0, 1, 2, 3, 4].map((r) => cells[r * 5 + c]).join("");

/** The id and prefilled value of each input of a recorded modal. */
const inputsOf = (modal: unknown) =>
  [...JSON.stringify(modal).matchAll(/\{[^{}]*"type":4[^{}]*\}/g)].map(([m]) => [
    /"custom_id":"([^"]+)"/.exec(m)?.[1],
    /"value":"([^"]*)"/.exec(m)?.[1],
  ]);

test("a square opens its across and down words, prefilled with . for blanks", async () => {
  const { ctx } = setup({ cells: `cRa${".".repeat(22)}` });
  const { i, calls } = fakeClick("u");
  await cellHandler.handle(i, [DATE, "1", "2"], ctx);

  expect(calls.modal).toHaveLength(1);
  expect(calls.modal[0]?.custom_id).toBe(`crossword:cellword:${DATE}:1:2`);
  expect(inputsOf(calls.modal[0])).toEqual([
    ["1a", "CRA.."],
    ["3d", "A...."],
  ]);
});

test("an empty slot's input has no value", async () => {
  const { ctx } = setup();
  const { i, calls } = fakeClick("u");
  await cellHandler.handle(i, [DATE, "1", "7"], ctx);

  expect(inputsOf(calls.modal[0])).toEqual([
    ["6a", undefined],
    ["3d", undefined],
  ]);
});

test("a finished round, a stale stamp or a block id re-renders instead of opening", async () => {
  const done = setup(FINISHED);
  const a = fakeClick("u");
  await cellHandler.handle(a.i, [DATE, "1", "7"], done.ctx);
  expect(a.calls.modal).toHaveLength(0);
  expect(a.calls.update).toHaveLength(1);

  const { ctx } = setup();
  const b = fakeClick("u");
  await cellHandler.handle(b.i, [DATE, "zz", "7"], ctx);
  expect(b.calls.modal).toHaveLength(0);
  expect(b.calls.update).toHaveLength(1);

  const c = fakeClick("u");
  await cellHandler.handle(c.i, [DATE, "1", "x7"], ctx);
  expect(c.calls.modal).toHaveLength(0);
  expect(c.calls.update).toHaveLength(1);
});

test("submit writes both words in one go; down wins the shared square", async () => {
  const { ctx, repo } = setup();
  const { i, calls } = fakeModal("u", { "1a": "crane", "1d": "zoups" });
  await cellWordHandler.handle(i, [DATE, "1", "0"], ctx);

  const cells = stored(repo)!.cells;
  expect(cells.slice(0, 5)).toBe("zrane");
  expect(column(cells, 0)).toBe("zoups");
  expect(stored(repo)?.finishedAt).toBeNull();
  expect(viewText(calls.update[0])).toContain("Words 2/10");
});

test("`.` keeps a square and an empty input skips its slot", async () => {
  const { ctx, repo } = setup({ cells: `crane${".".repeat(20)}` });
  const { i } = fakeModal("u", { "1a": "", "1d": ".OUPS" });
  await cellWordHandler.handle(i, [DATE, "1", "0"], ctx);

  expect(stored(repo)?.cells).toBe("craneo....u....p....s....");
});

test("an invalid input is free and stores nothing", async () => {
  const { ctx, repo } = setup();
  const { i, calls } = fakeModal("u", { "1a": "crane", "1d": "co" });
  await cellWordHandler.handle(i, [DATE, "1", "0"], ctx);

  expect(calls.reply[0]?.content).toBe("Use 5 letters A–Z, . for a blank — no points lost.");
  expect(calls.reply[0]?.flags).toBeDefined();
  expect(stored(repo)?.cells).toBe(".".repeat(25));
  expect(stored(repo)?.wrong).toBe(0);
  expect(calls.update).toHaveLength(0);
});

test("revealed letters stay and the line says so", async () => {
  const { ctx, repo } = setup({ cells: `R${".".repeat(24)}` });
  const { i, calls } = fakeModal("u", { "1a": "crane", "1d": "" });
  await cellWordHandler.handle(i, [DATE, "1", "0"], ctx);

  expect(stored(repo)?.cells.slice(0, 5)).toBe("Rrane");
  expect(stored(repo)?.lastLine).toBe("🔎 Kept the revealed letters in 1 Across");
  expect(viewText(calls.update[0])).toContain("🔎 Kept the revealed letters in 1 Across");
});

test("a stale stamp refreshes the board, or says stale when it can't", async () => {
  const { ctx, repo } = setup();
  const a = fakeModal("u", { "1a": "crane" });
  await cellWordHandler.handle(a.i, [DATE, "zz", "0"], ctx);
  expect(a.calls.update).toHaveLength(1);
  expect(stored(repo)?.cells).toBe(".".repeat(25));

  const b = fakeModal("u", { "1a": "crane" }, { notFromMessage: true });
  await cellWordHandler.handle(b.i, [DATE, "zz", "0"], ctx);
  expect(b.calls.reply[0]?.content).toBe(STALE);
});

test("a finished round's submit stores nothing and re-renders", async () => {
  const { ctx, repo } = setup({ ...FINISHED, cells: "z".repeat(25) });
  const { i, calls } = fakeModal("u", { "1a": "crane" });
  await cellWordHandler.handle(i, [DATE, "1", "0"], ctx);

  expect(stored(repo)?.cells).toBe("z".repeat(25));
  expect(calls.update).toHaveLength(1);
});

test("the router sends square clicks and their modals to these handlers", () => {
  const router = buildRouter([crosswordModule()]);

  expect(router.component(`crossword:cell:${DATE}:1:7`)?.handler).toBe(cellHandler);
  expect(router.component(`crossword:cell:${DATE}:1:x7`)?.args).toEqual([DATE, "1", "x7"]);
  expect(router.modal(`crossword:cellword:${DATE}:1:7`)?.handler).toBe(cellWordHandler);
});
