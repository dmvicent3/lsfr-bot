import { expect, setSystemTime, spyOn, test } from "bun:test";
import { Database } from "bun:sqlite";
import { runMigrations } from "../../../../src/core/db.ts";
import { coreMigrations } from "../../../../src/core/settings.ts";
import type { Ctx } from "../../../../src/core/types.ts";
import { answerHandler } from "../../../../src/modules/grid/components/answer.ts";
import { cellHandler } from "../../../../src/modules/grid/components/cell.ts";
import { gridComponents } from "../../../../src/modules/grid/components/components.ts";
import { giveUpHandler } from "../../../../src/modules/grid/components/give-up.ts";
import { newHandler } from "../../../../src/modules/grid/components/new.ts";
import { pageHandler } from "../../../../src/modules/grid/components/page.ts";
import { gridModals } from "../../../../src/modules/grid/modals.ts";
import { gridMigrations } from "../../../../src/modules/grid/store/migrations.ts";
import { GameStore } from "../../../../src/modules/grid/store/games.ts";
import { PracticeStore } from "../../../../src/modules/grid/store/practice.ts";
import { GridRepo } from "../../../../src/modules/grid/store/repo.ts";
import type { Game, Practice } from "../../../../src/modules/grid/types.ts";
import { GRID, snapshot } from "../render/fixtures.ts";
import { game, practice } from "../store/fixtures.ts";
import { fakeClick, fakeModal } from "./fake.ts";

const DATE = "2026-11-03";
const OUT_OF_DATE = "This grid is out of date. Use /grid play.";
const source = () => snapshot;
const answer = answerHandler(source);
const cell = cellHandler(source);
const giveUp = giveUpHandler(source);

function setup(over: Partial<Game> | null = {}, round: Partial<Practice> | null = null) {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, [...coreMigrations, ...gridMigrations]);
  const repo = new GridRepo(db);
  repo.puzzles.create({ guildId: "g", date: DATE, grid: GRID });

  if (over) repo.games.start(game(over));

  if (round) repo.practice.replace(practice({ grid: GRID, ...round }));

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- handlers only read ctx.db
  return { db, repo, ctx: { db } as unknown as Ctx };
}

const stored = (repo: GridRepo, userId = "u") => repo.games.get("g", DATE, userId);
const cells = (over: Record<number, string>) => Array.from({ length: 9 }, (_, i) => over[i] ?? "");
const FINISHED = { finishedAt: 5, points: 10, filled: 0, streak: 1 };

/** Eight cells filled with distinct countries, A1 left empty (Spain fits it). */
function almostFull(): string[] {
  const grid = GRID;
  const used = new Set<string>(["ES"]);
  const out = [""];

  for (let c = 1; c < 9; c++) {
    const pick = grid.answers[c]!.find((x) => !used.has(x))!;
    used.add(pick);
    out.push(pick);
  }

  return out;
}

test("an empty cell opens the answer modal for that cell", async () => {
  const { ctx } = setup();
  const { i, calls } = fakeClick("u");
  await cell.handle(i, [DATE, "4"], ctx);

  expect(calls.modal).toHaveLength(1);
  expect(calls.modal[0]?.custom_id).toBe(`grid:answer:${DATE}:4`);
  expect(calls.update).toHaveLength(0);
});

test("a filled cell or a finished game re-renders the board", async () => {
  const filled = setup({ cells: cells({ 0: "ES" }), guesses: 1 });
  const a = fakeClick("u");
  await cell.handle(a.i, [DATE, "0"], filled.ctx);
  expect(a.calls.modal).toHaveLength(0);
  expect(a.calls.update[0]?.content).toContain("Country grid #1");

  const done = setup(FINISHED);
  const b = fakeClick("u");
  await cell.handle(b.i, [DATE, "4"], done.ctx);
  expect(b.calls.modal).toHaveLength(0);
  expect(b.calls.update[0]?.components).toEqual([]);
});

test("a missing game is out of date, ephemeral, and writes nothing", async () => {
  const { repo, ctx } = setup(null);
  const c = fakeClick("u");
  await cell.handle(c.i, [DATE, "0"], ctx);
  const m = fakeModal("u", "Spain");
  await answer.handle(m.i, [DATE, "0"], ctx);

  expect(c.calls.reply[0]?.content).toBe(OUT_OF_DATE);
  expect(m.calls.reply[0]?.content).toBe(OUT_OF_DATE);
  expect(stored(repo)).toBeNull();
});

test("a submit after the game finished elsewhere re-renders and writes nothing", async () => {
  const { ctx } = setup(FINISHED);
  const save = spyOn(GameStore.prototype, "save");
  const { i, calls } = fakeModal("u", "Spain");
  await answer.handle(i, [DATE, "0"], ctx);
  const writes = save.mock.calls.length;
  save.mockRestore();

  expect(writes).toBe(0);
  expect(calls.update).toHaveLength(1);
  expect(calls.send).toHaveLength(0);
});

test("an unknown name or a used country costs nothing", async () => {
  const { repo, ctx } = setup({ cells: cells({ 0: "ES" }), guesses: 1 });
  const a = fakeModal("u", "Narnia");
  await answer.handle(a.i, [DATE, "1"], ctx);
  const b = fakeModal("u", "Spain");
  await answer.handle(b.i, [DATE, "1"], ctx);

  expect(a.calls.reply[0]?.content).toBe(`Didn't recognise "Narnia" — no guess used.`);
  expect(b.calls.reply[0]?.content).toBe("Spain is already on your grid — no guess used.");
  expect(a.calls.update.length + b.calls.update.length).toBe(0);
  expect(stored(repo)?.guesses).toBe(1);
});

test("a miss costs a guess and shows the reason", async () => {
  const { repo, ctx } = setup();
  const { i, calls } = fakeModal("u", "Japan");
  await answer.handle(i, [DATE, "0"], ctx);

  expect(stored(repo)?.guesses).toBe(1);
  expect(stored(repo)?.cells[0]).toBe("");
  expect(stored(repo)?.lastMiss).toBe("Japan: isn't in Europe");
  expect(calls.update[0]?.content).toContain("❌ Japan: isn't in Europe");
  expect(calls.send).toHaveLength(0);
});

test("a hit fills the cell and adds the running points", async () => {
  const { repo, ctx } = setup({ points: 15, guesses: 1 });
  const { i, calls } = fakeModal("u", "Spain");
  await answer.handle(i, [DATE, "0"], ctx);
  const g = stored(repo);

  expect(g?.cells[0]).toBe("ES");
  expect(g?.guesses).toBe(2);
  expect(g?.points).toBeGreaterThan(24);
  expect(g?.finishedAt).toBeNull();
  expect(calls.update[0]?.content).toContain("Guesses 2/9");
  expect(calls.send).toHaveLength(0);
});

test("the last guess finishes in one write and announces once", async () => {
  const { repo, ctx } = setup({ guesses: 8, points: 40 });
  const save = spyOn(GameStore.prototype, "save");
  const { i, calls } = fakeModal("u", "Japan");
  await answer.handle(i, [DATE, "0"], ctx);
  const writes = save.mock.calls.length;
  save.mockRestore();
  const g = stored(repo);

  expect(writes).toBe(1);
  expect(g?.finishedAt).not.toBeNull();
  expect(g?.guesses).toBe(9);
  expect(calls.update[0]?.components).toEqual([]);
  expect(calls.send).toHaveLength(1);
  expect(calls.send[0]?.content).toBe(
    `<@u> filled 0/9 on Country grid #1 — ${g?.points} pts\n⬜⬜⬜\n⬜⬜⬜\n⬜⬜⬜`,
  );
  expect(calls.send[0]?.allowedMentions).toEqual({ parse: [] });
});

test("the ninth cell finishes with a perfect grid", async () => {
  const { repo, ctx } = setup({ cells: almostFull(), guesses: 8, points: 100 });
  const { i, calls } = fakeModal("u", "Spain");
  await answer.handle(i, [DATE, "0"], ctx);

  expect(stored(repo)?.filled).toBe(9);
  expect(calls.update[0]?.content).toContain("Perfect: +30");
  expect(calls.send[0]?.content).toContain("filled 9/9");
});

test("a failing send is logged and the game counts", async () => {
  const { repo, ctx } = setup({ guesses: 8 });
  const err = spyOn(console, "error").mockImplementation(() => {});
  const { i, calls } = fakeModal("u", "Japan", { failSend: true });
  await answer.handle(i, [DATE, "0"], ctx);

  expect(err).toHaveBeenCalled();
  err.mockRestore();
  expect(stored(repo)?.finishedAt).not.toBeNull();
  expect(calls.update).toHaveLength(1);
});

test("Give up finishes once and announces; pressing it again does not", async () => {
  const { repo, ctx } = setup({ cells: cells({ 0: "ES" }), guesses: 1, points: 12 });
  const a = fakeClick("u");
  await giveUp.handle(a.i, [DATE], ctx);
  const b = fakeClick("u");
  await giveUp.handle(b.i, [DATE], ctx);

  expect(stored(repo)?.finishedAt).not.toBeNull();
  expect(stored(repo)?.filled).toBe(1);
  expect(a.calls.update[0]?.components).toEqual([]);
  expect(a.calls.send).toHaveLength(1);
  expect(b.calls.send).toHaveLength(0);
  expect(b.calls.update).toHaveLength(1);
});

test("practice never announces, and its New button stays when finished", async () => {
  const { repo, ctx } = setup(null, { guesses: 8 });
  const { i, calls } = fakeModal("u", "Japan");
  await answer.handle(i, ["practice", "0"], ctx);

  expect(repo.practice.get("g", "u")?.finishedAt).not.toBeNull();
  expect(calls.send).toHaveLength(0);
  expect(calls.update[0]?.content).toContain("Practice grid");
  expect(calls.update[0]?.components).toHaveLength(1);

  const g = fakeClick("u");
  await giveUp.handle(g.i, ["practice"], ctx);
  expect(g.calls.send).toHaveLength(0);
});

test("practice cells open the modal and a hit adds points", async () => {
  const { repo, ctx } = setup(null, {});
  const c = fakeClick("u");
  await cell.handle(c.i, ["practice", "0"], ctx);
  const m = fakeModal("u", "Spain");
  await answer.handle(m.i, ["practice", "0"], ctx);

  expect(c.calls.modal[0]?.custom_id).toBe("grid:answer:practice:0");
  expect(repo.practice.get("g", "u")?.cells[0]).toBe("ES");
  expect(repo.practice.get("g", "u")?.points).toBeGreaterThan(0);
});

test("New replaces the practice round and shows the new board", async () => {
  const { repo, ctx } = setup(null, { guesses: 5, cells: cells({ 0: "ES" }) });
  const replace = spyOn(PracticeStore.prototype, "replace");
  const { i, calls } = fakeClick("u");
  await newHandler(source).handle(i, [], ctx);
  const replaced = replace.mock.calls.length;
  replace.mockRestore();
  const p = repo.practice.get("g", "u");

  expect(replaced).toBe(1);
  expect(p?.guesses).toBe(0);
  expect(p?.cells.every((c) => c === "")).toBe(true);
  expect(calls.update[0]?.content).toContain("Practice grid · Guesses 0/9");
});

test("the date comes from the custom ID", async () => {
  const { repo, ctx } = setup({ guesses: 8 });
  repo.puzzles.create({ guildId: "g", date: "2026-11-04", grid: GRID });
  const { i } = fakeModal("u", "Japan");
  await answer.handle(i, [DATE, "0"], ctx);

  expect(stored(repo)?.finishedAt).not.toBeNull();
  expect(repo.games.get("g", "2026-11-04", "u")).toBeNull();
});

test("a user without a game is out of date and writes nothing", async () => {
  const { repo, ctx } = setup();
  const { i, calls } = fakeModal("other", "Spain");
  await answer.handle(i, [DATE, "0"], ctx);

  expect(calls.reply[0]?.content).toBe(OUT_OF_DATE);
  expect(stored(repo)?.guesses).toBe(0);
  expect(stored(repo, "other")).toBeNull();
});

test("another user's submit updates their own game and leaves the first user's alone", async () => {
  const { repo, ctx } = setup();
  repo.games.start(game({ userId: "other" }));
  const { i, calls } = fakeModal("other", "Spain");
  await answer.handle(i, [DATE, "0"], ctx);

  expect(stored(repo, "other")?.cells[0]).toBe("ES");
  expect(stored(repo, "other")?.guesses).toBe(1);
  expect(stored(repo)).toMatchObject({ guesses: 0, points: null, lastMiss: null });
  expect(stored(repo)?.cells.every((c) => c === "")).toBe(true);
  expect(calls.update).toHaveLength(1);
});

const OVER = { cells: cells({ 0: "ES", 1: "PT" }), guesses: 9, points: 30 };

test("a click on an over but unfinished game finishes it and announces once", async () => {
  const { repo, ctx } = setup(OVER);
  const a = fakeClick("u");
  await cell.handle(a.i, [DATE, "4"], ctx);
  const b = fakeClick("u");
  await cell.handle(b.i, [DATE, "4"], ctx);

  expect(stored(repo)?.finishedAt).not.toBeNull();
  expect(stored(repo)?.filled).toBe(2);
  expect(a.calls.modal).toHaveLength(0);
  expect(a.calls.update[0]?.components).toEqual([]);
  expect(a.calls.send).toHaveLength(1);
  expect(b.calls.send).toHaveLength(0);
});

test("a submit on an over but unfinished game finishes it and announces once", async () => {
  const { repo, ctx } = setup(OVER);
  const a = fakeModal("u", "Japan");
  await answer.handle(a.i, [DATE, "4"], ctx);
  const b = fakeModal("u", "Japan");
  await answer.handle(b.i, [DATE, "4"], ctx);

  expect(stored(repo)?.finishedAt).not.toBeNull();
  expect(stored(repo)?.guesses).toBe(9);
  expect(a.calls.send).toHaveLength(1);
  expect(b.calls.send).toHaveLength(0);
});

test("Give up on an over but unfinished game finishes it, shows the award and announces once", async () => {
  const { repo, ctx } = setup(OVER);
  const a = fakeClick("u");
  await giveUp.handle(a.i, [DATE], ctx);
  const b = fakeClick("u");
  await giveUp.handle(b.i, [DATE], ctx);

  expect(stored(repo)?.finishedAt).not.toBeNull();
  expect(a.calls.update[0]?.content).toContain("**+");
  expect(a.calls.send).toHaveLength(1);
  expect(b.calls.send).toHaveLength(0);
});

test("a practice round that is over heals on the next click, without an announcement", async () => {
  const { repo, ctx } = setup(null, { ...OVER, points: 0 });
  const { i, calls } = fakeClick("u");
  await cell.handle(i, ["practice", "4"], ctx);

  expect(repo.practice.get("g", "u")?.finishedAt).not.toBeNull();
  expect(calls.send).toHaveLength(0);
  expect(calls.modal).toHaveLength(0);
});

test("a submit that is not from a message still answers, ephemerally with the board", async () => {
  const { repo, ctx } = setup();
  const { i, calls } = fakeModal("u", "Spain", { notFromMessage: true });
  await answer.handle(i, [DATE, "0"], ctx);

  expect(stored(repo)?.cells[0]).toBe("ES");
  expect(calls.update).toHaveLength(0);
  expect(calls.reply).toHaveLength(1);
  expect(calls.reply[0]?.content).toContain("Country grid #1");
});

test("New leaves the daily game untouched", async () => {
  const { repo, ctx } = setup({ cells: cells({ 0: "ES" }), guesses: 1, points: 20 });
  const before = stored(repo);
  const { i } = fakeClick("u");
  await newHandler(source).handle(i, [], ctx);

  expect(stored(repo)).toEqual(before);
  expect(repo.practice.get("g", "u")).not.toBeNull();
});

/** The same sequence on every call to the factory. */
const seeded = () => {
  let x = 7;

  return () => (x = (x * 48271) % 2147483647) / 2147483647;
};

test("New uses the injected random and refuses outside a server", async () => {
  const { repo, ctx } = setup(null);
  const a = fakeClick("u");
  await newHandler(source, seeded()).handle(a.i, [], ctx);
  const first = repo.practice.get("g", "u")?.grid;
  const b = fakeClick("u");
  await newHandler(source, seeded()).handle(b.i, [], ctx);
  const dm = fakeClick("u", { noGuild: true });
  await newHandler(source).handle(dm.i, [], ctx);

  expect(first).toBeDefined();
  expect(repo.practice.get("g", "u")?.grid).toEqual(first);
  expect(dm.calls.reply[0]?.content).toBe("Country grid works in a server.");
  expect(dm.calls.update).toHaveLength(0);
});

test("page re-renders the leaderboard for the period and page asked", async () => {
  setSystemTime(new Date("2026-11-03T12:00:00Z"));
  const { repo, ctx } = setup(null);

  for (let n = 0; n < 12; n++) {
    repo.games.start(
      game({ userId: `p${n}`, filled: 3, points: 50 + n, streak: 1, finishedAt: 5 }),
    );
  }

  repo.games.start(
    game({ date: "2026-11-01", userId: "old", filled: 1, points: 5, finishedAt: 5 }),
  );

  const ask = async (period: string, page: string) => {
    const { i, calls } = fakeClick("u");
    await pageHandler.handle(i, [period, page], ctx);

    return calls.update[0]?.content ?? "";
  };

  const today1 = await ask("today", "1");
  const today2 = await ask("today", "2");
  const all1 = await ask("all", "1");
  setSystemTime();

  expect(today1).toContain("<@p11>");
  expect(today1).not.toContain("<@p0>");
  expect(today2).toContain("<@p0>");
  expect(today1).not.toContain("<@old>");
  expect(all1).not.toBe(today1);
});

test("the handlers are listed", () => {
  expect(gridComponents(source).map((h) => h.id)).toEqual([
    "grid:cell",
    "grid:giveup",
    "grid:new",
    "grid:page",
  ]);
  expect(gridModals(source).map((h) => h.id)).toEqual(["grid:answer"]);
});
