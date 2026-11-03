import { expect, test } from "bun:test";
import type { ModalBuilder } from "discord.js";
import { cellModal } from "../../../../src/modules/crossword/render/cell-modal.ts";
import { bigView, V } from "./fixtures.ts";

const inputs = (json: ReturnType<ModalBuilder["toJSON"]>) =>
  json.components.flatMap((r) => ("components" in r ? r.components : []));

test("a cell's modal: title by row and column, one input per slot through it, across first", () => {
  const json = cellModal(V, 7).toJSON();

  expect(json.custom_id).toBe("crossword:cellword:2026-11-05:mh1x:7");
  expect(json.title).toBe("Row 2, column 3");
  expect(inputs(json)).toEqual([
    {
      type: 4,
      custom_id: "6a",
      label: "6 Across (5)",
      style: 1,
      placeholder: "clue 6a",
      required: false,
      min_length: 0,
      max_length: 5,
    },
    {
      type: 4,
      custom_id: "3d",
      label: "3 Down (5)",
      style: 1,
      placeholder: "clue 3d",
      required: false,
      min_length: 0,
      max_length: 5,
      value: "A....",
    },
  ]);
});

test("prefill: the slot's letters uppercase with . for blanks; an all-empty slot has no value", () => {
  const json = cellModal({ ...V, cells: `cRa${".".repeat(22)}` }, 2).toJSON();

  expect(inputs(json).map((c) => ("value" in c ? c.value : undefined))).toEqual(["CRA..", "A...."]);
  expect(inputs(cellModal(V, 7).toJSON()).map((c) => ("value" in c ? c.value : undefined))).toEqual(
    [undefined, "A...."],
  );
});

test("within Discord's limits on a 7×7 with long clues", () => {
  const v = bigView();
  const white = v.stored.puzzle.slots.flatMap((s) => s.cells);

  for (const cell of new Set(white)) {
    const json = cellModal(v, cell).toJSON();

    expect(json.components.length).toBeGreaterThan(0);
    expect(json.components.length).toBeLessThanOrEqual(5);
    expect(json.title.length).toBeLessThanOrEqual(45);

    for (const c of inputs(json)) {
      expect(c.label?.length ?? 0).toBeLessThanOrEqual(45);
      expect(c.placeholder?.length ?? 0).toBeLessThanOrEqual(100);
    }
  }
});
