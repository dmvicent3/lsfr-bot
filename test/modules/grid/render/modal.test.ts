import { expect, test } from "bun:test";
import { answerModal } from "../../../../src/modules/grid/render/modal.ts";
import { RULES } from "../../../../src/modules/grid/rules/catalogue.ts";
import { GRID } from "./fixtures.ts";

test("answer modal fields", () => {
  const json = answerModal("2026-11-05", 4, GRID).toJSON();
  expect(json.custom_id).toBe("grid:answer:2026-11-05:4");
  expect(json.title).toBe("Cell B2");
  expect(json.components).toMatchObject([
    {
      components: [
        {
          custom_id: "country",
          label: "Country",
          placeholder: "Asia · Island nation",
          max_length: 60,
          required: true,
          style: 1,
        },
      ],
    },
  ]);
});

test("placeholder is truncated to 100", () => {
  const def = RULES[GRID.rows[0]!];
  const saved = def.label;
  def.label = "r".repeat(120);

  try {
    const json = answerModal("practice", 0, GRID).toJSON();
    expect(JSON.stringify(json)).toMatch(/"placeholder":"[^"]{100}"/);
  } finally {
    def.label = saved;
  }
});
