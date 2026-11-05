import { expect, test } from "bun:test";
import { ComponentType } from "discord.js";
import { fakeClick, fakeModal } from "../../../core/fake-interaction.ts";
import { flatComponents, viewText } from "../view-text.ts";
import { answerHandler } from "../../../../src/modules/crossword/components/answer.ts";
import { cluesHandler } from "../../../../src/modules/crossword/components/clues.ts";
import { pickHandler } from "../../../../src/modules/crossword/components/pick.ts";
import { revealHandler } from "../../../../src/modules/crossword/components/reveal.ts";
import { emptyCells } from "../../../../src/modules/crossword/play/cells.ts";
import { slotKey } from "../../../../src/modules/crossword/render/ids.ts";
import { storedGrid15 } from "../play/fixtures.ts";
import { setup } from "./setup.ts";

const G = storedGrid15();
const { puzzle } = G;
const firstDown = puzzle.slots.findIndex((s) => s.dir === "d");
const downKey = slotKey(puzzle.slots[firstDown]!);

/** A 15×15 practice round started at 1 (stamp "1"). */
const practice15 = () => setup(null, { ...G, cells: emptyCells(puzzle) });

/** The custom ids of a sent board, in order. */
const idsOf = (m?: { components?: unknown[] }) =>
  flatComponents(m?.components).flatMap((c) =>
    typeof c.custom_id === "string" ? [c.custom_id] : [],
  );

test("Down re-renders the board on the Down clues, the menu in every id", async () => {
  const { ctx } = practice15();
  const { i, calls } = fakeClick("u");
  await cluesHandler.handle(i, ["practice", "1", "d0", "dir"], ctx);

  const sent = calls.update[0]!;

  expect(viewText(sent)).toContain("**Down**");
  expect(viewText(sent)).not.toContain("**Across**");
  expect(idsOf(sent)).toContain("crossword:pick:practice:1:d0");
  expect(idsOf(sent)).toContain("crossword:reveal:practice:1:d0");
});

test("▶ shows the next page; a page past the end is clamped", async () => {
  const { ctx } = practice15();
  const a = fakeClick("u");
  await cluesHandler.handle(a.i, ["practice", "1", "a1", "next"], ctx);
  expect(idsOf(a.calls.update[0])).toContain("crossword:pick:practice:1:a1");

  const b = fakeClick("u");
  await cluesHandler.handle(b.i, ["practice", "1", "a9", "next"], ctx);
  expect(idsOf(b.calls.update[0])).toContain("crossword:pick:practice:1:a1");
});

test("a picked clue's modal carries the menu; the answer keeps it on the board", async () => {
  const { ctx, repo } = practice15();
  const pick = fakeClick("u", { values: [downKey] });
  await pickHandler.handle(pick.i, ["practice", "1", "d0"], ctx);

  const modalId = pick.calls.modal[0]?.custom_id;

  expect(modalId).toBe(`crossword:answer:practice:1:${downKey}:d0`);

  const word = puzzle.answers[firstDown]!.toUpperCase();
  const answer = fakeModal("u", word);
  await answerHandler.handle(answer.i, modalId!.split(":").slice(2), ctx);

  const sent = answer.calls.update[0]!;
  const select = flatComponents(sent.components).find((c) => c.type === ComponentType.StringSelect);

  expect(repo.practice.get("g", "u")?.cells).toContain(puzzle.answers[firstDown]![0]);
  expect(select?.custom_id).toBe("crossword:pick:practice:1:d0");
  expect(viewText(sent)).toContain(`~~${puzzle.slots[firstDown]!.n}. `);
  expect(JSON.stringify(select)).not.toContain(`"value":"${downKey}"`);
});

test("a control without a menu falls back to Across, page 1", async () => {
  const { ctx } = practice15();
  const { i, calls } = fakeClick("u");
  await revealHandler.handle(i, ["practice", "1"], ctx);

  expect(idsOf(calls.update[0])).toContain("crossword:pick:practice:1:a0");
});

test("a stale clues button shows the current board", async () => {
  const { ctx } = practice15();
  const { i, calls } = fakeClick("u");
  await cluesHandler.handle(i, ["practice", "zz", "d0", "dir"], ctx);

  expect(idsOf(calls.update[0])).toContain("crossword:pick:practice:1:d0");
});
