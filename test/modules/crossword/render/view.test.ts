import { expect, test } from "bun:test";
import { ComponentType, MessageFlags } from "discord.js";
import { solutionOf } from "../../../../src/modules/crossword/play/cells.ts";
import { boardView } from "../../../../src/modules/crossword/render/board-view.ts";
import { newId, slotKey } from "../../../../src/modules/crossword/render/ids.ts";
import { crosswordView } from "../../../../src/modules/crossword/render/view.ts";
import type { BoardView } from "../../../../src/modules/crossword/render/types.ts";
import type { Game, Practice } from "../../../../src/modules/crossword/types.ts";
import { flatComponents, viewText } from "../view-text.ts";
import { big15View, bigView, SQUARE, V } from "./fixtures.ts";

type View = ReturnType<typeof crosswordView>;

const PRACTICE: BoardView = { ...V, scope: "practice", number: null };

/** The custom ids of each action row, top to bottom. */
const ids = (v: View) =>
  v.components.flatMap((r) =>
    r.type === ComponentType.ActionRow
      ? [r.components.map((c) => ("custom_id" in c ? c.custom_id : ""))]
      : [],
  );

const rows = (v: View) => v.components.filter((r) => r.type === ComponentType.ActionRow);

const control = (v: View) =>
  rows(v)
    .at(-1)!
    .components.map((c) => ({
      style: "style" in c ? c.style : 0,
      disabled: "disabled" in c ? c.disabled : undefined,
    }));

test("Components V2: header text, the grid image, the clue text, then the rows", () => {
  const v = crosswordView(V);

  expect(v.flags).toBe(MessageFlags.IsComponentsV2);
  expect("content" in v).toBe(false);
  expect(v.allowedMentions).toEqual({ parse: [] });
  expect(v.components.slice(0, 3)).toEqual([
    { type: ComponentType.TextDisplay, content: "Crossword #3 · Words 1/10 · 95 pts · 2:14" },
    {
      type: ComponentType.MediaGallery,
      items: [{ media: { url: "attachment://crossword.png" } }],
    },
    expect.objectContaining({ type: ComponentType.TextDisplay }),
  ]);
  expect(viewText(v)).toContain("**Across**\n1. clue 1a (5)");
});

test("5×5 in progress: 25 square buttons, then check, reveal and give up", () => {
  const v = crosswordView(V);
  const r = ids(v);

  expect(r).toHaveLength(6);
  expect(r.slice(0, 5).flat()).toEqual(
    Array.from({ length: 25 }, (_, i) => `crossword:cell:2026-11-05:mh1x:${i}`),
  );
  expect(r[5]).toEqual([
    "crossword:check:2026-11-05:mh1x",
    "crossword:reveal:2026-11-05:mh1x",
    "crossword:giveup:2026-11-05:mh1x",
  ]);
  expect(control(v)).toEqual([
    { style: 1, disabled: true },
    { style: 2, disabled: undefined },
    { style: 4, disabled: undefined },
  ]);
});

test("7×7 in progress keeps the clue select above the controls", () => {
  const v = crosswordView(bigView());

  expect(ids(v)[0]).toEqual(["crossword:pick:2026-11-05:mh1x"]);
  expect(ids(v)).toHaveLength(2);
});

test("a 5×5 practice fits Discord's limits: 38 components, unique ids, 5 buttons a row", () => {
  const v = crosswordView(PRACTICE);
  const all = flatComponents(v.components);
  const custom = all.flatMap((c) => (typeof c.custom_id === "string" ? [c.custom_id] : []));

  expect(all).toHaveLength(38);
  expect(all.length).toBeLessThanOrEqual(40);
  expect(new Set(custom).size).toBe(custom.length);

  for (const r of rows(v)) expect(r.components.length).toBeLessThanOrEqual(5);
});

test("15×15 in progress: clue rows above the controls, carrying the menu", () => {
  const r = ids(crosswordView(big15View({ menu: { dir: "d", page: 1 } })));

  expect(r).toHaveLength(3);
  expect(r[1]).toEqual(["crossword:pick:practice:mh1x:d1"]);
  expect(r[2]).toEqual([
    "crossword:check:practice:mh1x:d1",
    "crossword:reveal:practice:mh1x:d1",
    "crossword:giveup:practice:mh1x:d1",
    "crossword:new:15",
  ]);
});

test("a 15×15 practice fits Discord's limits in play and finished", () => {
  for (const b of [big15View(), big15View({ finished: true })]) {
    const v = crosswordView(b);
    const all = flatComponents(v.components);
    const custom = all.flatMap((c) => (typeof c.custom_id === "string" ? [c.custom_id] : []));

    expect(all.length).toBeLessThanOrEqual(40);
    expect(new Set(custom).size).toBe(custom.length);
    expect(viewText(v).length).toBeLessThanOrEqual(4000);

    for (const r of rows(v)) expect(r.components.length).toBeLessThanOrEqual(5);
  }
});

test("Check is enabled once the grid is full, right or wrong", () => {
  const v = crosswordView({ ...V, cells: "z".repeat(25) });

  expect(control(v)[0]).toEqual({ style: 1, disabled: false });
});

test("every view carries one crossword.png and clears old attachments", () => {
  for (const b of [V, { ...V, finished: true }, bigView()]) {
    const v = crosswordView(b);

    expect(v.attachments).toEqual([]);
    expect(v.files).toHaveLength(1);
    expect(v.files[0]!.name).toBe("crossword.png");
    expect([...v.files[0]!.attachment.subarray(1, 4)]).toEqual([0x50, 0x4e, 0x47]);
  }
});

test("practice in progress adds New for its size", () => {
  expect(ids(crosswordView(PRACTICE))[5]).toEqual([
    "crossword:check:practice:mh1x",
    "crossword:reveal:practice:mh1x",
    "crossword:giveup:practice:mh1x",
    "crossword:new:5",
  ]);
});

test("daily finished: only the texts and the image, no squares or controls", () => {
  const v = crosswordView({ ...V, finished: true });

  expect(v.components.map((c) => c.type)).toEqual([
    ComponentType.TextDisplay,
    ComponentType.MediaGallery,
    ComponentType.TextDisplay,
  ]);
});

test("practice finished keeps New, no squares", () => {
  expect(ids(crosswordView({ ...PRACTICE, finished: true }))).toEqual([["crossword:new:5"]]);
  expect(ids(crosswordView(bigView({ scope: "practice", number: null, finished: true })))).toEqual([
    ["crossword:new:7"],
  ]);
});

test("all the text is within 4000 characters", () => {
  for (const b of [bigView(), bigView({ finished: true })]) {
    expect(viewText(crosswordView(b)).length).toBeLessThanOrEqual(4000);
  }
});

test("id builders", () => {
  expect(newId(7)).toBe("crossword:new:7");
  expect(slotKey({ n: 12, dir: "d" })).toBe("12d");
});

const GAME: Game = {
  guildId: "g",
  date: "2026-11-05",
  userId: "u",
  cells: "craneolive".padEnd(25, "."),
  wrong: 1,
  reveals: 0,
  lastLine: "x",
  solved: null,
  points: null,
  streak: null,
  startedAt: 36 * 36,
  finishedAt: null,
};
const WHERE = { scope: GAME.date, number: 3, stored: SQUARE };

test("boardView: running time, stamp in base 36, base points", () => {
  const v = boardView(WHERE, GAME, 36 * 36 + 61_000);

  expect(v).toMatchObject({
    stamp: "100",
    elapsedMs: 61_000,
    points: 90,
    finished: false,
    solved: false,
    award: null,
    lastLine: "x",
  });
});

test("boardView: finished daily takes finishedAt and rebuilds its award", () => {
  const cells = "x".repeat(25);
  const done = { ...GAME, cells, solved: true, points: 100, streak: 2, finishedAt: 36 * 36 + 5000 };
  const v = boardView(WHERE, done, 9e9);

  expect(v.elapsedMs).toBe(5000);
  expect(v.points).toBe(100);
  expect(v.solved).toBe(true);
  expect(v.award).toEqual({
    points: 95,
    parts: ["Solved: 100", "Wrong checks: −10", "Streak 2: +5"],
  });
});

test("boardView: a daily given up on a full grid is not solved", () => {
  const cells = "x".repeat(25);
  const done = { ...GAME, cells, solved: false, points: 0, streak: 1, finishedAt: 36 * 36 + 1 };
  const v = boardView(WHERE, done, 9e9);

  expect(v.solved).toBe(false);
  expect(v.award).toEqual({ points: 0, parts: [] });
});

test("boardView: a given award wins; practice has none", () => {
  const practice: Practice = {
    ...SQUARE,
    guildId: "g",
    userId: "u",
    cells: GAME.cells,
    wrong: 0,
    reveals: 0,
    lastLine: null,
    startedAt: 0,
    finishedAt: 7,
  };
  const given = { points: 1, parts: ["a"] };

  expect(boardView({ ...WHERE, scope: "practice", number: null }, practice, 99).award).toBeNull();
  expect(boardView(WHERE, GAME, 0, given).award).toBe(given);
});

test("boardView: a finished practice is solved when its grid is right", () => {
  const where = { ...WHERE, scope: "practice", number: null };
  const base = { ...SQUARE, guildId: "g", userId: "u", wrong: 0, reveals: 0, lastLine: null };
  const round = (cells: string): Practice => ({ ...base, cells, startedAt: 0, finishedAt: 7 });

  expect(boardView(where, round(solutionOf(SQUARE.puzzle)), 9).solved).toBe(true);
  expect(boardView(where, round("z".repeat(25)), 9).solved).toBe(false);
});
