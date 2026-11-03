import { expect, test } from "bun:test";
import { clueModal } from "../../../../src/modules/crossword/render/modal.ts";
import { SQUARE } from "./fixtures.ts";

const slot = SQUARE.puzzle.slots.find((s) => s.n === 6 && s.dir === "a")!;

test("clue modal fields", () => {
  const json = clueModal("2026-11-05", "mh1x", slot, "A bird").toJSON();

  expect(json.custom_id).toBe("crossword:answer:2026-11-05:mh1x:6a");
  expect(json.title).toBe("6 Across (5)");
  expect(json.components).toMatchObject([
    {
      components: [
        {
          custom_id: "word",
          label: "Answer",
          placeholder: "A bird",
          min_length: 5,
          max_length: 5,
          required: true,
          style: 1,
        },
      ],
    },
  ]);
});

test("placeholder is the clue cut to 100", () => {
  const json = clueModal("practice", "x", slot, "c".repeat(120)).toJSON();

  expect(JSON.stringify(json)).toMatch(/"placeholder":"c{99}…"/);
});
