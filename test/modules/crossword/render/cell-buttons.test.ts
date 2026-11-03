import { expect, test } from "bun:test";
import { cellLabel, cellRows } from "../../../../src/modules/crossword/render/cell-buttons.ts";
import { V } from "./fixtures.ts";

const flat = (cells: string) => cellRows({ ...V, cells }).flatMap((r) => r.components);

test("labels: empty is ·, typed and revealed are uppercase, a block is ■", () => {
  expect(cellLabel(".")).toBe("·");
  expect(cellLabel("c")).toBe("C");
  expect(cellLabel("R")).toBe("R");
  expect(cellLabel("#")).toBe("■");
});

test("5 rows of 5, one per cell, ids carry scope, stamp and index", () => {
  const rows = cellRows(V);

  expect(rows).toHaveLength(5);
  expect(rows.map((r) => r.components.length)).toEqual([5, 5, 5, 5, 5]);
  expect(rows[1]!.components[2]!.custom_id).toBe("crossword:cell:2026-11-05:mh1x:7");
  expect(rows[0]!.components.map((b) => b.label)).toEqual(["C", "R", "A", "N", "E"]);
  expect(rows[1]!.components[0]!.label).toBe("·");
});

test("typed and empty are Secondary, revealed Primary", () => {
  const buttons = flat(`cR.${".".repeat(22)}`);

  expect(buttons.slice(0, 3).map((b) => b.style)).toEqual([2, 1, 2]);
});

test("blocks are disabled ■ buttons with their own unique ids", () => {
  const buttons = flat(`##c..${".".repeat(20)}`);
  const ids = buttons.map((b) => b.custom_id);

  expect(buttons[0]).toMatchObject({
    label: "■",
    style: 2,
    disabled: true,
    custom_id: "crossword:cell:2026-11-05:mh1x:x0",
  });
  expect(buttons[1]!.custom_id).toBe("crossword:cell:2026-11-05:mh1x:x1");
  expect(buttons[2]!.disabled).toBeUndefined();
  expect(new Set(ids).size).toBe(25);

  for (const b of buttons) expect(b.label!.length).toBeLessThanOrEqual(80);
});
