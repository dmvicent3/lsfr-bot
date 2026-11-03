import { expect, test } from "bun:test";
import type { Ctx } from "../../../../src/core/types.ts";
import type { Game } from "../../../../src/modules/sudoku/types.ts";
import { checkHandler } from "../../../../src/modules/sudoku/components/check.ts";
import { sudokuComponents } from "../../../../src/modules/sudoku/components/components.ts";
import { modeHandler } from "../../../../src/modules/sudoku/components/mode.ts";
import { moveHandler } from "../../../../src/modules/sudoku/components/move.ts";
import { newHandler } from "../../../../src/modules/sudoku/components/new.ts";
import { pageArgs } from "../../../../src/modules/sudoku/components/page.ts";
import { putHandler } from "../../../../src/modules/sudoku/components/put.ts";
import { EASY_SOLUTION } from "../fixtures.ts";
import { makeGame } from "../play/game.ts";
import { freshDb } from "../store/fixtures.ts";
import { fakeClick } from "../../../core/fake-interaction.ts";

const practice = (over: Partial<Game> = {}): Game => makeGame({ date: "", slot: "", ...over });

// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- handlers only read ctx.db
const ctxOf = (db: unknown) => ({ db }) as unknown as Ctx;

test("put refuses digits outside 1-9", async () => {
  const { db, repo } = freshDb();
  const g = practice();
  repo.games.replace(g);

  for (const bad of ["0", "x", "10", ""]) {
    const { i, calls } = fakeClick("u");
    await putHandler.handle(i, [bad, "practice"], ctxOf(db));
    expect(calls.reply).toHaveLength(1);
  }

  expect(repo.games.get(g)).toEqual(g);
});

test("put writes a valid digit", async () => {
  const { db, repo } = freshDb();
  repo.games.replace(practice());
  const { i } = fakeClick("u");
  await putHandler.handle(i, ["5", "practice"], ctxOf(db));

  expect(repo.games.get(practice())?.cells[2]).toBe("5");
});

test("mode flips note mode and re-renders; a put then toggles a note", async () => {
  const { db, repo } = freshDb();
  repo.games.replace(practice());
  const { i, calls } = fakeClick("u");
  await modeHandler.handle(i, ["practice"], ctxOf(db));

  expect(repo.games.get(practice())?.noteMode).toBe(true);
  expect(calls.update).toHaveLength(1);
  expect(calls.update[0]?.files?.map((x) => x.name)).toEqual(["sudoku.png"]);

  await putHandler.handle(fakeClick("u").i, ["5", "practice"], ctxOf(db));
  const after = repo.games.get(practice());
  expect(after?.cells[2]).toBe("0");
  expect(after?.notes[2 * 9 + 4]).toBe("1");
  expect(after?.cursor).toBe(2);

  await modeHandler.handle(fakeClick("u").i, ["practice"], ctxOf(db));
  expect(repo.games.get(practice())?.noteMode).toBe(false);
});

test("move refuses an unknown direction", async () => {
  const { db, repo } = freshDb();
  repo.games.replace(practice());
  const { i, calls } = fakeClick("u");
  await moveHandler.handle(i, ["sideways", "practice"], ctxOf(db));

  expect(calls.reply).toHaveLength(1);
});

test("check spends a check", async () => {
  const { db, repo } = freshDb();
  repo.games.replace(practice());
  const { i } = fakeClick("u");
  await checkHandler.handle(i, ["practice"], ctxOf(db));

  expect(repo.games.get(practice())?.checks).toBe(1);
});

test("new replaces the practice game at the same level", async () => {
  const { db, repo } = freshDb();
  repo.games.replace(practice({ level: "easy" }));
  const { i, calls } = fakeClick("u");
  await newHandler(() => 0.5).handle(i, ["practice"], ctxOf(db));

  expect(calls.order).toEqual(["deferUpdate", "editReply"]);
  expect(calls.update).toHaveLength(0);
  expect(calls.editReply[0]?.files?.map((x) => x.name)).toEqual(["sudoku.png"]);
  expect(calls.editReply[0]?.attachments).toEqual([]);
  const fresh = repo.games.get(practice());
  expect(fresh?.level).toBe("easy");
  expect(fresh?.startedAt).toBeGreaterThan(0);
});

test("new works on a solved practice board and replaces it", async () => {
  const { db, repo } = freshDb();
  repo.games.replace(practice({ level: "medium", solvedAt: 5, cells: EASY_SOLUTION }));
  const { i, calls } = fakeClick("u");
  await newHandler(() => 0.5).handle(i, ["practice"], ctxOf(db));

  expect(calls.order).toEqual(["deferUpdate", "editReply"]);
  const fresh = repo.games.get(practice());
  expect(fresh?.level).toBe("medium");
  expect(fresh?.solvedAt).toBeNull();
});

test("new on a daily board is out of date", async () => {
  const { db } = freshDb();
  const { i, calls } = fakeClick("u");
  await newHandler(() => 0.5).handle(i, ["daily", "2026-11-03", "easy"], ctxOf(db));

  expect(calls.reply).toHaveLength(1);
});

test("page args fall back to today's first page", () => {
  expect(pageArgs(["week", "2"])).toEqual({ period: "week", page: 2 });
  expect(pageArgs(["year", "x"])).toEqual({ period: "today", page: 1 });
});

test("every handler is registered once", () => {
  const ids = sudokuComponents(Math.random).map((h) => h.id);

  expect(ids.toSorted()).toEqual([
    "sudoku:check",
    "sudoku:clear",
    "sudoku:mode",
    "sudoku:move",
    "sudoku:new",
    "sudoku:page",
    "sudoku:put",
  ]);
});
