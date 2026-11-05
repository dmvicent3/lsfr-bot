import { expect, test } from "bun:test";
import { runMigrations } from "../../../../src/core/db.ts";
import { coreMigrations } from "../../../../src/core/settings.ts";
import type { Ctx } from "../../../../src/core/types.ts";
import { dateIn } from "../../../../src/core/zoned.ts";
import { multiAnswerHandler } from "../../../../src/modules/word/components/multi-answer.ts";
import { multiGiveUpHandler } from "../../../../src/modules/word/components/multi-give-up.ts";
import { multiGuessHandler } from "../../../../src/modules/word/components/multi-guess.ts";
import { GONE } from "../../../../src/modules/word/components/multi-round.ts";
import { fakeClick, fakeModal } from "../../../core/fake-interaction.ts";
import { freshDb } from "../fixtures.ts";

const TODAY = dateIn(Date.now(), "Europe/Lisbon");

/** Today's Duo of CRANE and SLATE, and a ctx the handlers read the database from. */
function setup() {
  const { db, repo } = freshDb();
  runMigrations(db, coreMigrations);
  const puzzle = { guildId: "g", mode: "duo" as const, date: TODAY, words: ["crane", "slate"] };
  repo.multiPuzzles.create({ ...puzzle, length: 5 });

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- handlers only read ctx.db
  const ctx = { db } as unknown as Ctx;

  return { repo, ctx, stored: () => repo.multiGames.get({ ...puzzle, userId: "u" }) };
}

const ARGS = ["duo", TODAY];

async function submit(ctx: Ctx, text: string, args = ARGS) {
  const m = fakeModal("u", text);
  await multiAnswerHandler.handle(m.i, args, ctx);

  return m.calls;
}

test("an old board's Guess button points to /duo guess", async () => {
  const { ctx } = setup();
  const c = fakeClick("u");
  await multiGuessHandler.handle(c.i, ARGS, ctx);

  expect(c.calls.modal).toHaveLength(0);
  expect(c.calls.reply[0]?.content).toBe("Guess with `/duo guess` now.");
});

test("a guess redraws the board in place", async () => {
  const { ctx, stored } = setup();
  const calls = await submit(ctx, "slate");

  expect(stored()?.guesses).toEqual(["slate"]);
  expect(calls.update[0]?.content).toContain("**Board 1** │ **Board 2** ✅");
  expect(calls.update[0]?.content).toContain("attempts left 6");
});

test("a refused guess is told privately and costs nothing", async () => {
  const { ctx, stored } = setup();
  const calls = await submit(ctx, "zzzzz");

  expect(calls.update).toHaveLength(0);
  expect(calls.reply[0]?.content).toBe("That's not in the word list. No attempt used.");
  expect(stored()).toBeNull();
});

test("the last word wins and drops the buttons", async () => {
  const { ctx, stored } = setup();
  await submit(ctx, "slate");
  const calls = await submit(ctx, "crane");

  expect(stored()).toMatchObject({ won: true, found: 2, points: 150 });
  expect(calls.update[0]?.content).toContain("All 2 solved!");
  expect(calls.update[0]?.components).toEqual([]);
  expect((await submit(ctx, "bumpy")).reply[0]?.content).toStartWith("You've finished Word Duo #");
});

test("Give up ends it as a loss and reveals the words", async () => {
  const { ctx, stored } = setup();
  await submit(ctx, "slate");
  const c = fakeClick("u");
  await multiGiveUpHandler.handle(c.i, ARGS, ctx);

  expect(stored()).toMatchObject({ won: false, found: 1, points: 50 });
  expect(c.calls.update[0]?.content).toContain("**Board 1** ❌ **CRANE**");

  const again = fakeClick("u");
  await multiGiveUpHandler.handle(again.i, ARGS, ctx);
  expect(again.calls.update[0]?.content).toContain("You gave up.");
});

test("an earlier day's board or a bad ID is refused", async () => {
  const { ctx } = setup();
  const old = await submit(ctx, "slate", ["duo", "2026-01-01"]);
  expect(old.reply[0]?.content).toBe("That Word Duo is over. Use `/duo play` for today's.");

  const bad = fakeClick("u");
  await multiGuessHandler.handle(bad.i, ["trio", TODAY], ctx);
  expect(bad.calls.reply[0]?.content).toBe(GONE);
});

test("a modal sent from elsewhere gets the board as a private reply", async () => {
  const { ctx } = setup();
  const m = fakeModal("u", "slate", { notFromMessage: true });
  await multiAnswerHandler.handle(m.i, ARGS, ctx);

  expect(m.calls.update).toHaveLength(0);
  expect(m.calls.reply[0]?.content).toContain("**Word Duo #");
});

test("a finish posts the squares publicly; an open guess posts nothing", async () => {
  const { ctx } = setup();
  const open = await submit(ctx, "slate");
  expect(open.followUp).toHaveLength(0);

  const won = await submit(ctx, "crane");
  expect(won.followUp[0]?.content).toMatch(/^<@u> solved Word Duo #\d+ in 2\/7\n/);
  expect(won.followUp[0]?.content).toEndWith("\n⬛⬛🟩⬛🟩 │ 🟩🟩🟩🟩🟩\n🟩🟩🟩🟩🟩");
  expect(won.followUp[0]?.flags).toBeUndefined();
  expect(won.followUp[0]?.allowedMentions).toEqual({ parse: [] });
});

test("giving up posts the squares once, without the words", async () => {
  const { ctx } = setup();
  await submit(ctx, "slate");
  const c = fakeClick("u");
  await multiGiveUpHandler.handle(c.i, ARGS, ctx);

  expect(c.calls.followUp[0]?.content).toMatch(/^<@u> missed Word Duo #\d+ — X\/7 · 1\/2 found\n/);
  expect(c.calls.followUp[0]?.content?.toLowerCase()).not.toMatch(/crane|slate/);

  const again = fakeClick("u");
  await multiGiveUpHandler.handle(again.i, ARGS, ctx);
  expect(again.calls.followUp).toHaveLength(0);
});
