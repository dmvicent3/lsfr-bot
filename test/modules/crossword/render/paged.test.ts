import { describe, expect, test } from "bun:test";
import { ComponentType } from "discord.js";
import { fill } from "../../../../src/modules/crossword/play/cells.ts";
import { openClues } from "../../../../src/modules/crossword/render/menu.ts";
import { pagedRows } from "../../../../src/modules/crossword/render/paged.ts";
import type { BoardView } from "../../../../src/modules/crossword/render/types.ts";
import { big15View } from "./fixtures.ts";

type Part = { custom_id?: string; label?: string; disabled?: boolean; style?: number };

const parts = (v: BoardView): Part[][] =>
  pagedRows(v).map((r) => r.components.map((c): Part => ({ ...c })));

const selectOf = (v: BoardView) => {
  const s = pagedRows(v)[1]!.components[0]!;

  if (s.type !== ComponentType.StringSelect) throw new Error("no select");

  return s;
};

const B = big15View();
const { puzzle } = B.stored;
const across = openClues(puzzle, B.cells, "a");

describe("the direction and page row", () => {
  test("Across shown: Across primary and off, Down opens its first page, ◀ off on page 1", () => {
    const [top] = parts(B);

    expect(top!.map((b) => b.label)).toEqual(["Across", "Down", "◀", "1/2", "▶"]);
    expect(top!.map((b) => b.custom_id)).toEqual([
      "crossword:clues:practice:mh1x:a0:dir",
      "crossword:clues:practice:mh1x:d0:dir",
      "crossword:clues:practice:mh1x:a0:prev",
      "crossword:clues:practice:mh1x:a0:at",
      "crossword:clues:practice:mh1x:a1:next",
    ]);
    expect(top!.map((b) => b.disabled)).toEqual([true, false, true, true, false]);
    expect(top!.map((b) => b.style)).toEqual([1, 2, 2, 2, 2]);
  });

  test("on the last page ▶ is off and ◀ goes back", () => {
    const [top] = parts(big15View({ menu: { dir: "d", page: 1 } }));

    expect(top!.map((b) => b.label)).toEqual(["Across", "Down", "◀", "2/2", "▶"]);
    expect(top!.map((b) => b.disabled)).toEqual([false, true, false, true, true]);
    expect(top![2]!.custom_id).toBe("crossword:clues:practice:mh1x:d0:prev");
  });
});

describe("the clue select", () => {
  test("one page of the direction's open clues, 25 at most, carrying the menu", () => {
    const s = selectOf(B);

    expect(s.custom_id).toBe("crossword:pick:practice:mh1x:a0");
    expect(s.placeholder).toBe("Pick an Across clue");
    expect(s.options.map((o) => o.value)).toEqual(
      across.slice(0, 25).map((i) => `${puzzle.slots[i]!.n}a`),
    );
  });

  test("the second page holds the rest", () => {
    const s = selectOf(big15View({ menu: { dir: "a", page: 1 } }));

    expect(s.options).toHaveLength(across.length - 25);
    expect(s.custom_id).toBe("crossword:pick:practice:mh1x:a1");
  });

  test("labels and descriptions stay within 100 characters", () => {
    for (const menu of [
      { dir: "a", page: 0 },
      { dir: "d", page: 1 },
    ] as const) {
      for (const o of selectOf(big15View({ menu })).options) {
        expect(o.label.length).toBeLessThanOrEqual(100);
        expect(o.description!.length).toBeLessThanOrEqual(100);
      }
    }
  });

  test("a solved clue drops out", () => {
    const i = across[0]!;
    const cells = fill(B.cells, puzzle.slots[i]!.cells, puzzle.answers[i]!);

    expect(selectOf({ ...B, cells }).options[0]!.value).toBe(`${puzzle.slots[across[1]!]!.n}a`);
  });

  test("every clue of the direction solved: a disabled select saying so", () => {
    const cells = across.reduce(
      (c, i) => fill(c, puzzle.slots[i]!.cells, puzzle.answers[i]!),
      B.cells,
    );
    const s = selectOf({ ...B, cells });

    expect(s.disabled).toBe(true);
    expect(s.placeholder).toBe("Every Across clue is solved");
    expect(s.options).toHaveLength(1);
  });
});

test("finished: only Across / Down, to read both lists with their answers", () => {
  const rows = parts(big15View({ finished: true }));

  expect(rows).toHaveLength(1);
  expect(rows[0]!.map((b) => b.label)).toEqual(["Across", "Down"]);
});
