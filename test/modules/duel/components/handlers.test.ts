import { expect, spyOn, test } from "bun:test";
import { Database } from "bun:sqlite";
import { runMigrations } from "../../../../src/core/db.ts";
import { coreMigrations } from "../../../../src/core/settings.ts";
import type { Ctx } from "../../../../src/core/types.ts";
import { duelComponents } from "../../../../src/modules/duel/components/components.ts";
import { nextHandler } from "../../../../src/modules/duel/components/next.ts";
import { pageArgs, pageHandler } from "../../../../src/modules/duel/components/page.ts";
import { pickHandler } from "../../../../src/modules/duel/components/pick.ts";
import { duelMigrations } from "../../../../src/modules/duel/store/migrations.ts";
import { GameStore } from "../../../../src/modules/duel/store/games.ts";
import { DuelRepo } from "../../../../src/modules/duel/store/repo.ts";
import type { Game } from "../../../../src/modules/duel/types.ts";
import { game, puzzle, question } from "../store/fixtures.ts";
import { fakeClick } from "./fake.ts";

const DATE = "2026-11-03";

function setup(over: Partial<Game> | null = {}) {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, [...coreMigrations, ...duelMigrations]);
  const repo = new DuelRepo(db);
  repo.puzzles.create(puzzle({ questions: [question(), question(), question()] }));

  if (over) repo.games.start(game(over));

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- handlers only read ctx.db
  return { db, repo, ctx: { db } as unknown as Ctx };
}

const stored = (repo: DuelRepo, userId = "u") => repo.games.get("g", DATE, userId);

test("a pick saves and reveals", async () => {
  const { repo, ctx } = setup();
  const { i, calls } = fakeClick("u");
  await pickHandler.handle(i, [DATE, "1", "b"], ctx);

  expect(stored(repo)?.answers).toBe("b");
  expect(calls.update).toHaveLength(1);
  expect(calls.update[0]?.content).toContain("✅ Right");
  expect(calls.send).toHaveLength(0);
});

test("a stale pick re-renders the current question", async () => {
  const { repo, ctx } = setup({ answers: "b" });
  const { i, calls } = fakeClick("u");
  await pickHandler.handle(i, [DATE, "1", "a"], ctx);

  expect(stored(repo)?.answers).toBe("b");
  expect(calls.update).toHaveLength(1);
  expect(calls.update[0]?.content).toContain("Question 2/3");
  expect(calls.reply).toHaveLength(0);
});

test("pick uses the date from the custom ID", async () => {
  const { repo, ctx } = setup({ answers: "bb" });
  const { i } = fakeClick("u");
  await pickHandler.handle(i, [DATE, "3", "b"], ctx);

  expect(stored(repo)?.finishedAt).not.toBeNull();
  expect(repo.games.get("g", "2026-11-04", "u")).toBeNull();
});

test("the last pick finishes in one write, posts the line and stores points", async () => {
  const { repo, ctx } = setup({ answers: "bb" });
  const save = spyOn(GameStore.prototype, "save");
  const { i, calls } = fakeClick("u");
  await pickHandler.handle(i, [DATE, "3", "b"], ctx);
  const writes = save.mock.calls.length;
  save.mockRestore();

  expect(writes).toBe(1);

  const g = stored(repo);
  expect(g?.answers).toBe("bbb");
  expect(g?.correct).toBe(3);
  expect(g?.points).toBeGreaterThan(0);
  expect(calls.update[0]?.content).toContain("**+");
  expect(calls.update[0]?.components).toEqual([]);
  expect(calls.send).toHaveLength(1);
  expect(calls.send[0]?.content).toBe("<@u> scored 3/3 on Stat duel #1 🟩🟩🟩");
  expect(calls.send[0]?.allowedMentions).toEqual({ parse: [] });
});

test("a failing send is logged and the game counts", async () => {
  const { repo, ctx } = setup({ answers: "bb" });
  const err = spyOn(console, "error").mockImplementation(() => {});
  const { i, calls } = fakeClick("u", { failSend: true });
  await pickHandler.handle(i, [DATE, "3", "b"], ctx);

  expect(err).toHaveBeenCalled();
  err.mockRestore();
  expect(stored(repo)?.finishedAt).not.toBeNull();
  expect(calls.update).toHaveLength(1);
});

test("Next shows question n + 1, then the result", async () => {
  const { repo, ctx } = setup({ answers: "b" });
  const first = fakeClick("u");
  await nextHandler.handle(first.i, [DATE], ctx);
  expect(first.calls.update[0]?.content).toContain("Question 2/3");

  repo.games.save(game({ answers: "bbb", correct: 3, points: 90, streak: 1, finishedAt: 5 }));
  const last = fakeClick("u");
  await nextHandler.handle(last.i, [DATE], ctx);
  expect(last.calls.update[0]?.content).toContain("3/3 correct");
  expect(last.calls.update[0]?.components).toEqual([]);
});

test("Next finishes a game with every answer but no finish, then shows the result", async () => {
  const { repo, ctx } = setup({ answers: "bbb" });
  const { i, calls } = fakeClick("u");
  await nextHandler.handle(i, [DATE], ctx);

  const g = stored(repo);
  expect(g?.finishedAt).not.toBeNull();
  expect(g?.points).toBeGreaterThan(0);
  expect(calls.update[0]?.content).toContain("3/3 correct");
  expect(calls.update[0]?.components).toEqual([]);
  expect(calls.send).toHaveLength(1);
});

const FINISHED = { answers: "bbb", correct: 3, points: 90, streak: 1, finishedAt: 5 };

test("Next on an already finished game announces nothing", async () => {
  const { ctx } = setup(FINISHED);
  const { i, calls } = fakeClick("u");
  await nextHandler.handle(i, [DATE], ctx);

  expect(calls.update).toHaveLength(1);
  expect(calls.send).toHaveLength(0);
});

test("a stale pick on a finished game neither writes nor announces", async () => {
  const { ctx } = setup(FINISHED);
  const save = spyOn(GameStore.prototype, "save");
  const { i, calls } = fakeClick("u");
  await pickHandler.handle(i, [DATE, "1", "a"], ctx);
  const writes = save.mock.calls.length;
  save.mockRestore();

  expect(writes).toBe(0);
  expect(calls.update).toHaveLength(1);
  expect(calls.send).toHaveLength(0);
});

test("a stale pick that heals the game announces it once", async () => {
  const { ctx } = setup({ answers: "bbb" });
  const { i, calls } = fakeClick("u");
  await pickHandler.handle(i, [DATE, "1", "a"], ctx);

  expect(calls.send).toHaveLength(1);
});

test("pick then Next on the finished game announces once overall", async () => {
  const { ctx } = setup({ answers: "bb" });
  const pick = fakeClick("u");
  await pickHandler.handle(pick.i, [DATE, "3", "b"], ctx);
  const next = fakeClick("u");
  await nextHandler.handle(next.i, [DATE], ctx);

  expect(pick.calls.send.length + next.calls.send.length).toBe(1);
});

test("another user's click acts on their own game", async () => {
  const { repo, ctx } = setup();
  const pick = fakeClick("other");
  await pickHandler.handle(pick.i, [DATE, "1", "b"], ctx);
  const next = fakeClick("other");
  await nextHandler.handle(next.i, [DATE], ctx);

  expect(pick.calls.reply[0]?.content).toBe("This question is out of date. Use /duel play.");
  expect(next.calls.reply).toHaveLength(1);
  expect(pick.calls.update).toHaveLength(0);
  expect(stored(repo)?.answers).toBe("");
  expect(stored(repo, "other")).toBeNull();
});

test("a missing puzzle or a bad date is out of date", async () => {
  const { ctx } = setup();
  const { i, calls } = fakeClick("u");
  await pickHandler.handle(i, ["2026-11-09", "1", "b"], ctx);
  await nextHandler.handle(i, ["nope"], ctx);

  expect(calls.reply).toHaveLength(2);
});

test("page re-renders the leaderboard and reads args leniently", async () => {
  const { ctx } = setup();
  const { i, calls } = fakeClick("u");
  await pageHandler.handle(i, ["week", "1"], ctx);

  expect(calls.update).toHaveLength(1);
  expect(pageArgs(["junk", "x"])).toEqual({ period: "today", page: 1 });
  expect(pageArgs(["month", "2"])).toEqual({ period: "month", page: 2 });
});

test("duelComponents lists the three handlers", () => {
  expect(duelComponents().map((h) => h.id)).toEqual(["duel:pick", "duel:next", "duel:page"]);
});
