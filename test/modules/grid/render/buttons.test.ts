import { expect, test } from "bun:test";
import { ButtonStyle } from "discord.js";
import { cellButtons, controlRow } from "../../../../src/modules/grid/render/buttons.ts";
import { cells } from "./fixtures.ts";

const names = new Map([["PT", "Portugal"]]);

test("cell buttons: ids, labels, styles", () => {
  const rows = cellButtons("2026-11-05", cells(), names, false);
  expect(rows).toHaveLength(3);
  expect(rows[0]?.components.map((c) => [c.label, c.custom_id])).toEqual([
    ["🇵🇹 Portugal", "grid:cell:2026-11-05:0"],
    ["A2", "grid:cell:2026-11-05:1"],
    ["A3", "grid:cell:2026-11-05:2"],
  ]);
  expect(rows[0]?.components[0]?.style).toBe(ButtonStyle.Success);
  expect(rows[0]?.components[1]?.style).toBe(ButtonStyle.Secondary);
  expect(rows[2]?.components[2]?.label).toBe("C3");
});

test("long names are truncated to 80", () => {
  const long = new Map([["PT", "x".repeat(120)]]);
  expect(cellButtons("practice", cells(), long, false)[0]?.components[0]?.label).toHaveLength(80);
});

test("no cell buttons when done", () => {
  expect(cellButtons("practice", cells(), names, true)).toEqual([]);
});

const flat = (r: ReturnType<typeof controlRow>) =>
  r.flatMap((x) => x.components.map((c) => [c.label, c.custom_id, c.style]));

test("control rows", () => {
  expect(flat(controlRow("2026-11-05", false, false))).toEqual([
    ["Give up", "grid:giveup:2026-11-05", ButtonStyle.Danger],
  ]);
  expect(flat(controlRow("practice", true, false))).toEqual([
    ["Give up", "grid:giveup:practice", ButtonStyle.Danger],
    ["New", "grid:new", ButtonStyle.Success],
  ]);
  expect(flat(controlRow("practice", true, true))).toEqual([
    ["New", "grid:new", ButtonStyle.Success],
  ]);
  expect(controlRow("2026-11-05", false, true)).toEqual([]);
});
